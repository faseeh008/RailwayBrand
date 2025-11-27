<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import {
		Send,
		Upload,
		Trash2,
		Bot,
		User,
		Sparkles,
		Edit2,
		CheckCircle,
		RefreshCw
	} from 'lucide-svelte';
	import ChatMessage from './ChatMessage.svelte';
	import TypingIndicator from './TypingIndicator.svelte';
	import SuggestionChips from './SuggestionChips.svelte';
	import { getEssentialQuestions } from '$lib/services/industry-questions';

	// Props
	export let questions: any[] = [];
	export let onComplete: (data: any) => void;
	export let canGenerate: boolean;

	// Step approval callbacks (from ProgressiveGenerator)
	export let onApproveStep: ((stepIndex: number) => void) | null = null;
	export let onRegenerateStep: ((stepIndex: number, feedback: string) => void) | null = null;
	export let totalSteps: number = 7;
	export let storageKey: string | null = null;
	export let onSessionSave:
		| ((payload: { id: string; brandName?: string; messages: Array<any>; state: any }) => void)
		| null = null;

	function getStorageKeys() {
		const suffix = storageKey ? `:${storageKey}` : '';
		return {
			messagesKey: `brandBuilderChatMessages${suffix}`,
			stateKey: `brandBuilderChatState${suffix}`
		};
	}

	// Message interface
	interface ChatMessage {
		id: string;
		type: 'bot' | 'user' | 'step';
		content: string;
		timestamp: Date;
		questionId?: string;
		suggestions?: string[];
		inputType?: string;
		isLogo?: boolean;
		questionIndex?: number; // Track which question this answer belongs to
		edited?: boolean; // Track if message was edited
		logoData?: string; // Base64 data URL for generated/uploaded logo
		// Step-specific fields
		stepData?: {
			stepId: string;
			stepTitle: string;
			stepDescription: string;
			content: any;
			stepIndex: number;
			isGenerating: boolean;
			isApproved: boolean;
		};
		waitingForFeedback?: boolean; // If true, user can type feedback for regeneration
		waitingForLogoAcceptance?: boolean; // If true, waiting for user to accept/reject logo
		logoRegenerationPrompt?: string; // User's prompt for logo enhancement
		logoAccepted?: boolean; // Track if logo was accepted
	}

	type IndustryQuestion = {
		id: string;
		question: string;
		type: string;
		required?: boolean;
		suggestions?: string[];
		icon?: string;
		helper?: string;
	};

	// State
	let messages: ChatMessage[] = [];
	let currentQuestionIndex = -1;
	let answers: Record<string, any> = {};
	let isTyping = false;
	let userInput = '';
	let chatContainer: HTMLElement;
	let fileInput: HTMLInputElement;
	let textInput: HTMLInputElement | null = null;
	let textareaInput: HTMLTextAreaElement | null = null;
	let logoPreview: string | null = null;
	let logoFile: File | null = null;
	let isMultiline = false;
	let showSuggestions = false;
	let currentSuggestions: string[] = [];
	let conversationComplete = false;
	let waitingForConfirmation = false; // Changed: Start with prompt input
	let isEditingMode = false;
	let editingQuestionIndex = -1;
	let returnToQuestionIndex = -1; // Remember where we were before editing
	let isGeneratingGuidelines = false; // Track if we're in generation phase
	let waitingForStepFeedback = false; // Track if we're waiting for user feedback for regeneration
	let currentRegeneratingStepIndex = -1; // Track which step is being regenerated
	let autoApproveTimeouts: Map<number, ReturnType<typeof setTimeout>> = new Map(); // Auto-approve timeouts for steps
	const AUTO_APPROVE_DELAY = 10000; // Auto-approve after 10 seconds if no feedback
	let generationAbortController: AbortController | null = null; // For aborting fetch requests
	let waitingForLogoAcceptance = false; // Track if we're waiting for user to accept/reject logo
	let currentLogoMessageId: string | null = null; // Track which message contains the logo

	// New state for enhanced flow
	let waitingForInitialPrompt = true; // NEW: Wait for user's initial prompt
	let isAnalyzingPrompt = false; // NEW: Track if we're analyzing the prompt
	let promptAnalysis: any = null; // NEW: Store analysis results
	let industryQuestions: any[] = []; // NEW: Industry-specific questions
	let allQuestions: any[] = []; // NEW: Combined essential + industry questions
	let hasFetchedIndustryQuestions = false; // NEW: Track if we've already fetched industry questions
	let collectedInfo: {
		brandName?: string;
		industry?: string;
		style?: string;
		audience?: string;
		description?: string;
		values?: string;
		industrySpecificInfo?: Record<string, any>;
	} = {}; // NEW: Collected information

	let groundingData: any = null;
	let groundingIndustry: string | null = null;
	let isFetchingGroundingData = false;
	let hasAnnouncedGrounding = false;

	// Focus input when appropriate
	$: if (!waitingForConfirmation && !conversationComplete && (textInput || textareaInput)) {
		// Use setTimeout to avoid autofocus conflicts
		setTimeout(() => {
			const elementToFocus = textareaInput || textInput;
			if (elementToFocus && document.activeElement !== elementToFocus) {
				elementToFocus.focus();
			}
		}, 150);
	}

	// Cleanup timeouts on destroy
	onDestroy(() => {
		autoApproveTimeouts.forEach((timeout) => clearTimeout(timeout));
		autoApproveTimeouts.clear();
	});

	// Initialize chat on mount
	onMount(async () => {
		// Only run in browser (not during SSR)
		if (typeof window === 'undefined') {
			return;
		}

		// Always reset processing states on mount to prevent stuck states
		isAnalyzingPrompt = false;
		isFetchingGroundingData = false;
		isTyping = false;

		// Check if we have saved messages in sessionStorage (browser only)
		let savedMessages: string | null = null;
		let savedState: string | null = null;

		if (window.sessionStorage) {
			const { messagesKey, stateKey } = getStorageKeys();
			savedMessages = sessionStorage.getItem(messagesKey);
			savedState = sessionStorage.getItem(stateKey);
		}

		if (savedMessages && savedState) {
			try {
				// Restore messages
				const parsedMessages = JSON.parse(savedMessages);
				messages = parsedMessages.map((msg: any) => ({
					...msg,
					timestamp: new Date(msg.timestamp)
				}));

				// Restore state
				const parsedState = JSON.parse(savedState);
				currentQuestionIndex = parsedState.currentQuestionIndex ?? -1;
				answers = parsedState.answers ?? {};
				conversationComplete = parsedState.conversationComplete ?? false;
				waitingForConfirmation = parsedState.waitingForConfirmation ?? false;

				// Check if we have any user messages - if not, we're waiting for initial prompt
				const hasUserMessages = messages.some((m) => m.type === 'user');
				const hasBotWelcome = messages.some(
					(m) => m.type === 'bot' && m.content.includes("👋 Hi! I'm your Brand Builder Assistant")
				);

				// Always reset processing states on reload to prevent stuck states
				isAnalyzingPrompt = false;
				isFetchingGroundingData = false;
				isTyping = false;

				allQuestions = parsedState.allQuestions ?? [];
				collectedInfo = parsedState.collectedInfo ?? {};
				hasFetchedIndustryQuestions = parsedState.hasFetchedIndustryQuestions ?? false;
				isGeneratingGuidelines = parsedState.isGeneratingGuidelines ?? false;
				waitingForStepFeedback = parsedState.waitingForStepFeedback ?? false;
				currentRegeneratingStepIndex = parsedState.currentRegeneratingStepIndex ?? -1;
				groundingData = parsedState.groundingData ?? null;
				groundingIndustry = parsedState.groundingIndustry ?? null;
				hasAnnouncedGrounding = parsedState.hasAnnouncedGrounding ?? false;
				waitingForLogoAcceptance = parsedState.waitingForLogoAcceptance ?? false;
				currentLogoMessageId = parsedState.currentLogoMessageId ?? null;

				// Determine if we should wait for initial prompt
				// If no user messages, we're waiting for initial prompt
				if (!hasUserMessages) {
					waitingForInitialPrompt = true;
					// If we also don't have a welcome message, send it
					if (!hasBotWelcome) {
						await delay(300);
						await sendBotMessage(
							"👋 Hi! I'm your Brand Builder Assistant. I'll help you create comprehensive brand guidelines.\n\n**Please describe what you'd like to create.** You can tell me about your brand name, industry, style preferences, or any other details you have in mind. I'll analyze your input and ask any additional questions needed!"
						);
					}
				} else {
					// We have user messages, so we're not waiting for initial prompt
					waitingForInitialPrompt = false;
				}

				// Restore UI state
				const questionsToUse = allQuestions.length > 0 ? allQuestions : questions;
				if (currentQuestionIndex >= 0 && currentQuestionIndex < questionsToUse.length) {
					const currentQ = questionsToUse[currentQuestionIndex];
					isMultiline = currentQ.type === 'textarea';
					showSuggestions = currentQ.type === 'text-with-suggestions';
					if (showSuggestions && currentQ.suggestions) {
						currentSuggestions = currentQ.suggestions;
					}
				}

				await scrollToBottom();
				return;
			} catch (error) {
				console.error('Failed to restore chat state:', error);
				// Clear corrupted state
				if (window.sessionStorage) {
					const { messagesKey, stateKey } = getStorageKeys();
					sessionStorage.removeItem(messagesKey);
					sessionStorage.removeItem(stateKey);
				}
				// Reset all state
				messages = [];
				currentQuestionIndex = -1;
				answers = {};
				conversationComplete = false;
				waitingForConfirmation = false;
				waitingForInitialPrompt = true;
				isAnalyzingPrompt = false;
				allQuestions = [];
				collectedInfo = {};
				hasFetchedIndustryQuestions = false;
				isGeneratingGuidelines = false;
				waitingForStepFeedback = false;
				currentRegeneratingStepIndex = -1;
				groundingData = null;
				groundingIndustry = null;
				hasAnnouncedGrounding = false;
				isFetchingGroundingData = false;
				waitingForLogoAcceptance = false;
				currentLogoMessageId = null;
				// Fall through to send initial message
			}
		}

		// Only send initial message if no saved state exists
		waitingForInitialPrompt = true;
		await delay(500);
		await sendBotMessage(
			"👋 Hi! I'm your Brand Builder Assistant. I'll help you create comprehensive brand guidelines.\n\n**Please describe what you'd like to create.** You can tell me about your brand name, industry, style preferences, or any other details you have in mind. I'll analyze your input and ask any additional questions needed!"
		);
		await scrollToBottom();
	});

	// Save messages to sessionStorage whenever they change (debounced to avoid too many writes)
	// Only run in browser (not during SSR)
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	$: if (typeof window !== 'undefined' && messages.length >= 0) {
		// Save even if empty to track state
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			try {
				if (typeof window !== 'undefined' && window.sessionStorage) {
					const { messagesKey, stateKey } = getStorageKeys();
					const serializedMessages = serializeMessagesForStorage(messages);
					const serializedState = buildPersistedState();
					sessionStorage.setItem(messagesKey, JSON.stringify(serializedMessages));
					sessionStorage.setItem(stateKey, JSON.stringify(serializedState));

					if (onSessionSave && storageKey) {
						onSessionSave({
							id: storageKey,
							brandName: collectedInfo.brandName || answers['brandName'] || '',
							messages: serializedMessages,
							state: serializedState
						});
					}
				}
			} catch (error) {
				console.error('Failed to save chat state:', error);
			}
		}, 400); // Debounce by 400ms
	}

	// Delay helper
	function delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function serializeMessagesForStorage(messageList: ChatMessage[]) {
		return messageList.map((msg) => ({
			...msg,
			timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
		}));
	}

	function buildPersistedState() {
		return {
			currentQuestionIndex,
			answers,
			conversationComplete,
			waitingForConfirmation,
			waitingForInitialPrompt,
			isAnalyzingPrompt,
			allQuestions,
			collectedInfo,
			hasFetchedIndustryQuestions,
			isGeneratingGuidelines,
			waitingForStepFeedback,
			currentRegeneratingStepIndex,
			groundingData,
			groundingIndustry,
			hasAnnouncedGrounding,
			waitingForLogoAcceptance,
			currentLogoMessageId
		};
	}

	async function ensureGroundingDataForIndustry(industry?: string) {
		const normalizedIndustry = typeof industry === 'string' ? industry.trim() : '';
		if (!normalizedIndustry) return;

		const industryChanged =
			!groundingIndustry || groundingIndustry.toLowerCase() !== normalizedIndustry.toLowerCase();

		if (!industryChanged && groundingData) {
			return;
		}

		if (isFetchingGroundingData) {
			return;
		}

		isFetchingGroundingData = true;

		try {
			if (!hasAnnouncedGrounding || industryChanged) {
				await sendBotMessage(
					`🌐 Let me research successful ${normalizedIndustry} brands so I can tailor the next questions.`
				);
				hasAnnouncedGrounding = true;
			}

			generationAbortController = new AbortController();
			const response = await fetch('/api/grounding-search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ industry: normalizedIndustry }),
				signal: generationAbortController.signal
			});

			if (!response.ok) {
				throw new Error('Failed to fetch grounding search data');
			}

			const result = await response.json();
			if (result?.groundingData) {
				groundingData = result.groundingData;
				groundingIndustry = normalizedIndustry;
				await sendBotMessage(
					`📊 I analyzed ${groundingData.websites.length} real ${normalizedIndustry} brands. I'll keep those insights in mind for our follow-up questions.`
				);
			}
		} catch (error) {
			console.error('Grounding search failed:', error);
			if (industryChanged || !groundingData) {
				await sendBotMessage(
					`⚠️ I couldn't analyze ${normalizedIndustry} websites right now, but I'll continue with what we have.`
				);
			}
		} finally {
			isFetchingGroundingData = false;
		}
	}

	// Scroll to bottom of chat
	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	// Send bot message
	async function sendBotMessage(
		content: string,
		questionId?: string,
		suggestions?: string[],
		inputType?: string,
		logoData?: string
	): Promise<ChatMessage> {
		isTyping = true;
		await scrollToBottom();
		await delay(800);

		const message: ChatMessage = {
			id: Date.now().toString(),
			type: 'bot',
			content,
			timestamp: new Date(),
			questionId,
			suggestions,
			inputType,
			isLogo: inputType === 'logo',
			logoData: logoData
		};

		messages = [...messages, message];
		isTyping = false;

		// Show suggestions if available
		if (suggestions && suggestions.length > 0) {
			showSuggestions = true;
			currentSuggestions = suggestions;
		} else {
			showSuggestions = false;
			currentSuggestions = [];
		}

		// Check if it's a textarea question
		isMultiline = inputType === 'textarea';

		await scrollToBottom();
		return message;
	}

	// Send user message
	async function sendUserMessage(content: string, questionIndex?: number) {
		const message: ChatMessage = {
			id: Date.now().toString(),
			type: 'user',
			content,
			timestamp: new Date(),
			questionIndex: questionIndex ?? currentQuestionIndex
		};

		messages = [...messages, message];
		await scrollToBottom();
	}

	// Handle editing a previous answer
	async function handleEditAnswer(questionIndex: number) {
		// Save where we currently are so we can restore after editing
		returnToQuestionIndex = currentQuestionIndex;

		// Use allQuestions if available, otherwise fall back to questions prop
		const questionsToUse = allQuestions.length > 0 ? allQuestions : questions;

		// Safety check: ensure question exists
		if (questionIndex < 0 || questionIndex >= questionsToUse.length) {
			console.error('Invalid question index for editing:', questionIndex);
			return;
		}

		const q = questionsToUse[questionIndex];
		if (!q) {
			console.error('Question not found at index:', questionIndex);
			return;
		}

		isEditingMode = true;
		editingQuestionIndex = questionIndex;
		currentQuestionIndex = questionIndex;

		// Pre-fill input with previous answer
		const previousAnswer = answers[q.id];
		if (previousAnswer && typeof previousAnswer === 'string') {
			userInput = previousAnswer;
		} else {
			userInput = '';
		}

		// Scroll to bottom to show input
		await scrollToBottom();

		// Re-show the question and update UI state
		showSuggestions = q.type === 'text-with-suggestions';
		if (showSuggestions && q.suggestions) {
			currentSuggestions = q.suggestions;
		} else {
			currentSuggestions = [];
		}
		isMultiline = q.type === 'textarea';
	}

	// NEW: Analyze user prompt and generate questions
	async function analyzePromptAndGenerateQuestions(userPrompt: string) {
		isAnalyzingPrompt = true;
		await sendBotMessage('🔍 Analyzing your prompt... Let me understand what you need!');

		try {
			// If conversation was already complete, reset state for new prompt
			if (conversationComplete) {
				// Reset conversation state for new prompt
				conversationComplete = false;
				isGeneratingGuidelines = false; // Reset generation state
				hasFetchedIndustryQuestions = false;
				answers = {}; // Clear old answers
				industryQuestions = []; // Clear old industry questions
				allQuestions = []; // Clear old questions
				currentQuestionIndex = -1; // Reset question index
				// Keep collectedInfo but will update it with new analysis
				groundingData = null;
				groundingIndustry = null;
				hasAnnouncedGrounding = false;
				isFetchingGroundingData = false;
			}

			// Analyze the prompt
			generationAbortController = new AbortController();
			const response = await fetch('/api/brand-builder/analyze-prompt', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userPrompt }),
				signal: generationAbortController.signal
			});

			if (!response.ok) {
				// Try to get error details from response
				let errorMessage = 'Failed to analyze prompt';
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorData.message || errorMessage;
					console.error('[chatbot] Prompt analysis error:', errorData);
				} catch (e) {
					console.error('[chatbot] Failed to parse error response:', e);
				}
				throw new Error(errorMessage);
			}

			const result = await response.json();

			if (!result.success || !result.analysis) {
				throw new Error(result.error || 'Invalid response from analysis API');
			}

			promptAnalysis = result.analysis;

			// Store extracted info - OVERWRITE with new analysis (don't keep old values)
			collectedInfo = {}; // Reset collectedInfo first
			if (promptAnalysis.brandName) collectedInfo.brandName = promptAnalysis.brandName;
			if (promptAnalysis.industry) collectedInfo.industry = promptAnalysis.industry;
			if (promptAnalysis.style) collectedInfo.style = promptAnalysis.style;
			if (promptAnalysis.audience) collectedInfo.audience = promptAnalysis.audience;
			if (promptAnalysis.description) collectedInfo.description = promptAnalysis.description;
			if (promptAnalysis.values) collectedInfo.values = promptAnalysis.values;

			if (collectedInfo.industry) {
				await ensureGroundingDataForIndustry(collectedInfo.industry);
			}

			await delay(500);

			// Create detailed feedback message based on analysis
			let feedbackMessage = '🔍 **Analysis Complete!**\n\n';

			// What we found
			const foundItems: string[] = [];
			if (promptAnalysis.brandName)
				foundItems.push(`✅ Brand name: **${promptAnalysis.brandName}**`);
			if (promptAnalysis.industry) foundItems.push(`✅ Industry: **${promptAnalysis.industry}**`);
			if (promptAnalysis.style) foundItems.push(`✅ Style: **${promptAnalysis.style}**`);
			if (promptAnalysis.audience)
				foundItems.push(`✅ Target audience: **${promptAnalysis.audience}**`);
			if (promptAnalysis.description)
				foundItems.push(
					`✅ Description: **${promptAnalysis.description.substring(0, 50)}${promptAnalysis.description.length > 50 ? '...' : ''}**`
				);
			if (promptAnalysis.values)
				foundItems.push(
					`✅ Brand values: **${promptAnalysis.values.substring(0, 50)}${promptAnalysis.values.length > 50 ? '...' : ''}**`
				);

			if (foundItems.length > 0) {
				feedbackMessage += '**What I found in your prompt:**\n' + foundItems.join('\n') + '\n\n';
			}

			// What's missing
			if (promptAnalysis.missingFields && promptAnalysis.missingFields.length > 0) {
				feedbackMessage += `**I need a bit more information:**\n`;
				feedbackMessage += promptAnalysis.missingFields
					.map((field: string) => {
						const fieldNames: Record<string, string> = {
							brandName: 'Brand name',
							industry: 'Industry',
							style: 'Visual style'
						};
						return `• ${fieldNames[field] || field}`;
					})
					.join('\n');
				feedbackMessage += '\n\n';
			}

			if (promptAnalysis.hasCompleteInfo) {
				feedbackMessage +=
					'Let me confirm a few details and ask some follow-up questions to make sure everything is perfect!';
			} else {
				feedbackMessage += "I'll ask you a few quick questions to fill in the gaps.";
			}

			await sendBotMessage(feedbackMessage);
			await delay(800);

			// Get essential questions
			const essentialQuestions = getEssentialQuestions({
				brandName: promptAnalysis.brandName,
				industry: promptAnalysis.industry,
				style: promptAnalysis.style
			});

			allQuestions = [...essentialQuestions];

			// If industry is known, get industry-specific questions
			if (promptAnalysis.industry || essentialQuestions.find((q) => q.id === 'industry')) {
				// We'll get industry questions after industry is selected
			}

			// Start asking questions
			if (allQuestions.length > 0) {
				currentQuestionIndex = -1;
				await askNextQuestion();
			} else {
				// No questions needed, proceed to industry questions or generation
				await handleQuestionsComplete();
			}
		} catch (error) {
			// Check if error is due to abort (stop requested)
			if (error instanceof Error && error.name === 'AbortError') {
				console.log('[chatbot] Prompt analysis aborted by user');
				isAnalyzingPrompt = false;
				return;
			}

			console.error('Error analyzing prompt:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// Provide more specific error messages
			let userFriendlyMessage = '⚠️ I encountered an error analyzing your prompt. ';
			if (errorMessage.includes('API key') || errorMessage.includes('GOOGLE_GEMINI_API')) {
				userFriendlyMessage += 'The AI service is not properly configured. Please contact support.';
			} else if (errorMessage.includes('Authentication')) {
				userFriendlyMessage += "Please make sure you're logged in and try again.";
			} else if (errorMessage.includes('Failed to analyze')) {
				userFriendlyMessage += 'Please try again with a more detailed prompt.';
			} else {
				userFriendlyMessage += 'Please try again or provide more details.';
			}

			await sendBotMessage(userFriendlyMessage);
		} finally {
			isAnalyzingPrompt = false;
		}
	}

	// NEW: Handle when essential questions are complete
	async function handleQuestionsComplete() {
		// Prevent multiple calls
		if (hasFetchedIndustryQuestions) {
			await finishConversation();
			return;
		}

		// Check if we have industry, then get industry-specific questions
		const industry = collectedInfo.industry || answers['industry'];

		if (industry) {
			await ensureGroundingDataForIndustry(industry);

			// Mark as fetched immediately to prevent duplicate calls
			hasFetchedIndustryQuestions = true;

			await delay(500);
			await sendBotMessage(
				`Great! Now let me ask a few ${industry}-specific questions to create more accurate guidelines.`
			);

			try {
				// Get already asked question IDs to prevent duplicates
				const alreadyAskedIds = allQuestions.map((q) => q.id);
				const alreadyAskedTexts = allQuestions.map((q) => q.question).filter(Boolean);

				const response = await fetch('/api/brand-builder/industry-questions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						industry: industry,
						existingInfo: {
							brandName: collectedInfo.brandName || answers['brandName'],
							style: collectedInfo.style || answers['style'],
							audience: collectedInfo.audience || answers['audience']
						},
						alreadyAskedQuestionIds: alreadyAskedIds, // Pass already asked IDs
						askedQuestions: alreadyAskedTexts,
						groundingData
					})
				});

				if (response.ok) {
					const result = await response.json();
					const newIndustryQuestions: IndustryQuestion[] = result.questions || [];

					if (newIndustryQuestions.length > 0) {
						// Deduplicate: only add questions that don't already exist (by ID)
						const existingQuestionIds = new Set(allQuestions.map((q) => q.id));
						const uniqueNewQuestions = newIndustryQuestions.filter(
							(q) => !existingQuestionIds.has(q.id)
						);

						if (uniqueNewQuestions.length > 0) {
							industryQuestions = uniqueNewQuestions;
							// Add only unique questions to the queue
							allQuestions = [...allQuestions, ...uniqueNewQuestions];
							await askNextQuestion();
						} else {
							// All questions were duplicates, add logo question
							console.log('[chatbot] All industry questions were duplicates, adding logo question');
							// Add logo question at the end if not already present
							if (!allQuestions.find((q) => q.id === 'logo')) {
								allQuestions.push({
									id: 'logo',
									question: 'Do you have a logo, or would you like us to generate one with AI?',
									type: 'logo',
									required: true,
									icon: '🖼️',
									helper:
										'Upload your existing logo or let AI create one based on your brand details'
								});
								await askNextQuestion();
							} else {
								// Logo question already exists, check if it's been answered
								const logoAnswer = answers['logo'];
								const isLogoAccepted =
									logoAnswer &&
									(logoAnswer.status === 'accepted' ||
										logoAnswer.status === 'generated' ||
										(logoAnswer.type !== 'ai-generated' && logoAnswer.fileData));
								if (isLogoAccepted) {
									await finishConversation();
								} else {
									// Logo question exists but not answered, ask it
									await askNextQuestion();
								}
							}
						}
					} else {
						// No industry questions, add logo question
						if (!allQuestions.find((q) => q.id === 'logo')) {
							allQuestions.push({
								id: 'logo',
								question: 'Do you have a logo, or would you like us to generate one with AI?',
								type: 'logo',
								required: true,
								icon: '🖼️',
								helper: 'Upload your existing logo or let AI create one based on your brand details'
							});
							await askNextQuestion();
						} else {
							// Logo question already exists, check if it's been answered
							const logoAnswer = answers['logo'];
							const isLogoAccepted =
								logoAnswer &&
								(logoAnswer.status === 'accepted' ||
									logoAnswer.status === 'generated' ||
									(logoAnswer.type !== 'ai-generated' && logoAnswer.fileData));
							if (isLogoAccepted) {
								await finishConversation();
							} else {
								// Logo question exists but not answered, ask it
								await askNextQuestion();
							}
						}
					}
				} else {
					// If industry questions fail, just proceed
					await finishConversation();
				}
			} catch (error) {
				console.error('Error getting industry questions:', error);
				await finishConversation();
			}
		} else {
			// No industry yet, finish conversation
			await finishConversation();
		}
	}

	// Update the summary after an edit
	async function updateSummary() {
		// Find the summary messages (there are 3 in finishConversation)
		const summaryStartIndex = messages.findIndex(
			(m) => m.type === 'bot' && m.content.includes('🎉 **All done!**')
		);

		if (summaryStartIndex !== -1) {
			// Remove old summary messages (3 messages total)
			messages = messages.slice(0, summaryStartIndex);

			// Re-add updated summary
			await delay(300);
			await sendBotMessage(
				"🎉 **All done!** I've collected all the information needed to generate your brand guidelines."
			);
			await delay(500);
			await sendBotMessage(
				"Here's your updated summary:\n\n" +
					Object.entries(answers)
						.filter(([key, value]) => value && key !== 'logo')
						.map(
							([key, value]) =>
								`• **${key}**: ${typeof value === 'string' ? value.substring(0, 50) : value}`
						)
						.join('\n') +
					'\n\n_💡 Tip: You can hover over any of your answers above and click the edit icon to make changes!_'
			);
			await delay(500);
			await sendBotMessage(
				'✨ Ready to generate your comprehensive brand guidelines? Click the button below!'
			);
		}
	}

	// Ask next question
	async function askNextQuestion() {
		// Don't proceed if waiting for logo acceptance
		if (waitingForLogoAcceptance) {
			console.log('[askNextQuestion] Blocked: waiting for logo acceptance');
			return;
		}

		// Check if current question is logo and logo is not accepted
		const questionsToUse = allQuestions.length > 0 ? allQuestions : questions;
		if (currentQuestionIndex >= 0 && currentQuestionIndex < questionsToUse.length) {
			const currentQuestion = questionsToUse[currentQuestionIndex];
			if (currentQuestion && currentQuestion.type === 'logo') {
				// Check if logo is accepted
				const logoAnswer = answers['logo'];
				if (
					!logoAnswer ||
					(logoAnswer.status !== 'accepted' &&
						logoAnswer.status !== 'generated' &&
						logoAnswer.type !== 'ai-generated')
				) {
					// Logo not accepted yet - don't proceed
					console.log('[askNextQuestion] Blocked: logo question and logo not accepted');
					return;
				}
				// If logo is uploaded (not AI-generated), it's automatically accepted
				if (logoAnswer && !logoAnswer.type && logoAnswer.fileData) {
					// Uploaded logo - consider it accepted
					logoAnswer.status = 'accepted';
				}
			}
		}

		currentQuestionIndex++;

		// Check if we've reached the end of questions
		if (currentQuestionIndex >= questionsToUse.length) {
			// Only call handleQuestionsComplete if we haven't already fetched industry questions
			// This prevents infinite loops
			if (!hasFetchedIndustryQuestions) {
				await handleQuestionsComplete();
			} else {
				// Already fetched industry questions - check if logo question needs to be added
				const hasLogoQuestion = allQuestions.find((q) => q.id === 'logo');
				const logoAnswer = answers['logo'];
				const isLogoAccepted =
					logoAnswer &&
					(logoAnswer.status === 'accepted' ||
						logoAnswer.status === 'generated' ||
						(logoAnswer.type !== 'ai-generated' && logoAnswer.fileData));

				if (!hasLogoQuestion) {
					// Add logo question if not present
					allQuestions.push({
						id: 'logo',
						question: 'Do you have a logo, or would you like us to generate one with AI?',
						type: 'logo',
						required: true,
						icon: '🖼️',
						helper: 'Upload your existing logo or let AI create one based on your brand details'
					});
					// Ask the logo question
					await askNextQuestion();
				} else if (!isLogoAccepted) {
					// Logo question exists but not answered/accepted yet - don't finish
					console.log('[askNextQuestion] Logo question exists but not accepted yet');
					return;
				} else {
					// Logo is accepted, finish conversation
					await finishConversation();
				}
			}
			return;
		}

		const q = questionsToUse[currentQuestionIndex];

		// Safety check: ensure question exists
		if (!q) {
			console.error('Question is undefined at index:', currentQuestionIndex);
			await finishConversation();
			return;
		}

		showSuggestions = false;

		await delay(500);

		// Build question message
		let questionText = `${q.icon} **${q.question}**`;
		if (q.helper) {
			questionText += `\n\n_${q.helper}_`;
		}

		await sendBotMessage(
			questionText,
			q.id,
			q.type === 'text-with-suggestions' ? q.suggestions : undefined,
			q.type
		);
	}

	async function persistLogoSnapshot(source: 'ai-generated' | 'upload') {
		if (
			!storageKey ||
			storageKey === 'local-chat' ||
			typeof fetch === 'undefined' ||
			!answers['logo'] ||
			!answers['logo'].fileData
		) {
			return;
		}

		const brandName = collectedInfo.brandName || answers['brandName'] || '';

		try {
			const logo = answers['logo'];
			const payload: Record<string, any> = {
				brandName,
				source,
				filename: logo.filename || `${brandName || 'brand'}-logo.svg`,
				storageId: logo.storageId,
				fileUrl: logo.fileUrl || logo.fileData
			};

			if (!logo.storageId && logo.fileData?.startsWith('data:')) {
				payload.logoData = logo.fileData;
			}

			await fetch(`/api/chat-sessions/${storageKey}/logo`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
		} catch (error) {
			console.warn('[chatbot] Failed to persist logo snapshot', error);
		}
	}

	// Handle logo acceptance
	async function handleAcceptLogo(messageId: string) {
		// Mark logo as accepted
		messages = messages.map((m) =>
			m.id === messageId ? { ...m, logoAccepted: true, waitingForLogoAcceptance: false } : m
		);

		// Update answers to mark logo as accepted
		if (answers['logo']) {
			answers['logo'].status = 'accepted';
		}

		waitingForLogoAcceptance = false;
		currentLogoMessageId = null;

		await sendBotMessage(
			"✅ Great! I've saved your logo. It will be used in your brand guidelines."
		);
		await persistLogoSnapshot('ai-generated');
		await delay(500);

		// Check if we're at the end of questions - if so, finish conversation
		const questionsToUse = allQuestions.length > 0 ? allQuestions : questions;
		if (currentQuestionIndex >= questionsToUse.length - 1) {
			// We've completed all questions including logo, finish conversation
			await finishConversation();
		} else {
			await askNextQuestion();
		}
	}

	// Handle logo rejection/regeneration request
	async function handleRegenerateLogo(messageId: string, enhancementPrompt?: string) {
		waitingForLogoAcceptance = false;

		if (enhancementPrompt) {
			await sendUserMessage(`🔄 ${enhancementPrompt}`);
		} else {
			await sendUserMessage('🔄 Please regenerate the logo with improvements');
		}

		await delay(500);
		await sendBotMessage(
			"🔄 I'll regenerate the logo with your requested changes. This will take a moment..."
		);

		// Collect all available information
		const brandName = collectedInfo.brandName || answers['brandName'] || '';
		const industry = collectedInfo.industry || answers['industry'] || '';
		const style = collectedInfo.style || answers['style'] || '';
		const audience = collectedInfo.audience || answers['audience'] || '';
		const description = collectedInfo.description || answers['shortDescription'] || '';
		const values = collectedInfo.values || answers['brandValues'] || '';

		try {
			isTyping = true;
			await scrollToBottom();

			// Call the logo generation API with enhancement prompt
			const response = await fetch('/api/generate-logo', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brandName,
					industry,
					style,
					description,
					values,
					audience,
					enhancementPrompt: enhancementPrompt || 'Please improve the logo design',
					// Include any industry-specific info from answers
					...Object.fromEntries(
						Object.entries(answers).filter(
							([key]) =>
								![
									'logo',
									'brandName',
									'industry',
									'style',
									'audience',
									'shortDescription',
									'brandValues'
								].includes(key)
						)
					)
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to regenerate logo');
			}

			const result = await response.json();

			if (result.success && result.logoUrl && result.logoId) {
				// Update the logo
				answers['logo'] = {
					type: 'ai-generated',
					fileData: result.logoUrl,
					fileUrl: result.logoUrl,
					storageId: result.logoId,
					filename: result.filename || `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`,
					status: 'pending-acceptance'
				};

				logoPreview = result.logoUrl;

				// Send bot message with the regenerated logo
				const logoMessage = await sendBotMessage(
					"✨ I've regenerated the logo with your requested changes. Please review it and let me know if you'd like to accept it or make further adjustments.",
					undefined,
					undefined,
					undefined,
					result.logoUrl
				);

				if (logoMessage && logoMessage.id) {
					currentLogoMessageId = logoMessage.id;
					waitingForLogoAcceptance = true;

					// Update the message to mark it as waiting for acceptance
					messages = messages.map((m) =>
						m.id === logoMessage.id
							? { ...m, waitingForLogoAcceptance: true, logoAccepted: false }
							: m
					);
				} else {
					console.error('[handleRegenerateLogo] Logo message not returned properly');
					throw new Error('Failed to create logo message');
				}
			} else {
				throw new Error(result.error || 'Failed to regenerate logo');
			}
		} catch (error: any) {
			console.error('Logo regeneration error:', error);
			await sendBotMessage(
				`⚠️ I encountered an issue regenerating your logo: ${error.message || 'Unknown error'}. Please try again or describe what changes you'd like.`
			);
		} finally {
			isTyping = false;
		}
	}

	// Handle user input submission
	async function handleSubmit() {
		const input = userInput.trim().toLowerCase();
		const userMessage = userInput.trim();

		// Check if we're waiting for logo acceptance and user is providing feedback
		if (
			typeof waitingForLogoAcceptance !== 'undefined' &&
			waitingForLogoAcceptance &&
			currentLogoMessageId &&
			userMessage
		) {
			// User is providing feedback for logo regeneration
			await handleRegenerateLogo(currentLogoMessageId, userMessage);
			userInput = '';
			return;
		}

		// Cancel all auto-approvals when user types (they're actively engaging)
		// Skip generation handling if we're waiting for initial prompt
		if (waitingForInitialPrompt) {
			// This will be handled by the waitingForInitialPrompt block below
		} else if (userMessage && isGeneratingGuidelines) {
			// Cancel auto-approval for all unapproved steps
			messages.forEach((m) => {
				if (m.type === 'step' && m.stepData && !m.stepData.isApproved && !m.stepData.isGenerating) {
					cancelAutoApprove(m.stepData.stepIndex);
				}
			});
		}

		// Check if we're in generation phase and user is providing step-related feedback
		// Skip this if we're waiting for initial prompt (user hasn't started yet)
		if (isGeneratingGuidelines && userMessage && !waitingForInitialPrompt) {
			const command = parseStepCommand(userMessage);

			if (command.action && command.stepIndex !== null) {
				// Cancel auto-approval since user is interacting
				cancelAutoApprove(command.stepIndex);

				// User is giving feedback about a step
				await sendUserMessage(userMessage);
				userInput = '';

				if (command.action === 'approve') {
					await handleApproveStep(command.stepIndex);
					return;
				} else if (
					command.action === 'change' ||
					command.action === 'modify' ||
					command.action === 'update' ||
					command.action === 'regenerate' ||
					command.action === 'add' ||
					command.action === 'remove'
				) {
					// User wants to modify a step
					const feedback = command.feedback || userMessage;
					if (feedback && feedback.length > 3) {
						await handleRegenerateStep(command.stepIndex, feedback, command.isCompleteReplacement);
					} else {
						await sendBotMessage('What specific changes would you like me to make to this step?');
					}
					return;
				}
			} else if (command.stepIndex !== null && !command.action) {
				// Cancel auto-approval since user is interacting
				cancelAutoApprove(command.stepIndex);

				// User mentioned a step but no clear action - ask for clarification
				await sendUserMessage(userMessage);
				userInput = '';
				await sendBotMessage(
					'What would you like me to do with this step? You can approve it, or ask me to change, add, or remove something.'
				);
				return;
			} else if (
				command.stepIndex === null &&
				(command.action === 'approve' || command.action === 'change' || command.action === 'modify')
			) {
				// User wants to approve/change but didn't specify which step - use most recent unapproved step
				const unapprovedSteps = messages
					.filter(
						(m) =>
							m.type === 'step' && m.stepData && !m.stepData.isApproved && !m.stepData.isGenerating
					)
					.map((m) => m.stepData!.stepIndex);

				if (unapprovedSteps.length > 0) {
					const mostRecentStep = unapprovedSteps[unapprovedSteps.length - 1];
					cancelAutoApprove(mostRecentStep);
					await sendUserMessage(userMessage);
					userInput = '';

					if (command.action === 'approve') {
						await handleApproveStep(mostRecentStep);
					} else {
						const feedback = command.feedback || userMessage;
						if (feedback && feedback.length > 3) {
							await handleRegenerateStep(mostRecentStep, feedback, command.isCompleteReplacement);
						} else {
							await sendBotMessage('What specific changes would you like me to make?');
						}
					}
					return;
				}
			} else if (!command.action && !command.stepIndex) {
				// User provided a general prompt during generation - analyze it deeply
				// This could be a request to modify something, add something, or change direction
				await sendUserMessage(userMessage);
				userInput = '';

				// Try to understand the intent
				const lowerPrompt = userMessage.toLowerCase();
				if (
					lowerPrompt.includes('add') ||
					lowerPrompt.includes('include') ||
					lowerPrompt.includes('also')
				) {
					await sendBotMessage(
						"I understand you want to add something. Could you specify which step you'd like to modify, or should I add this to the current step?"
					);
				} else if (
					lowerPrompt.includes('change') ||
					lowerPrompt.includes('modify') ||
					lowerPrompt.includes('update')
				) {
					await sendBotMessage(
						'I understand you want to make changes. Which step would you like me to modify, and what specific changes should I make?'
					);
				} else {
					// Deep analysis of the prompt
					await sendBotMessage('Let me analyze your request and see how I can help...');
					await delay(500);

					// Re-analyze the prompt in context of current generation
					try {
						const analysisResponse = await fetch('/api/brand-builder/analyze-prompt', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								userPrompt: userMessage,
								context: {
									isDuringGeneration: true,
									currentSteps: messages
										.filter((m) => m.type === 'step')
										.map((m) => ({
											title: m.stepData?.stepTitle,
											index: m.stepData?.stepIndex,
											isApproved: m.stepData?.isApproved
										}))
								}
							})
						});

						if (analysisResponse.ok) {
							const analysis = await analysisResponse.json();
							if (analysis.analysis) {
								// Use the analysis to understand what user wants
								await sendBotMessage(
									"I've analyzed your request. " +
										(analysis.analysis.missingFields?.length > 0
											? `I'll incorporate this into the brand guidelines.`
											: `I understand what you need. Let me continue with the generation.`)
								);
							}
						}
					} catch (error) {
						console.error('Error analyzing prompt during generation:', error);
						await sendBotMessage(
							'I encountered an error analyzing your request. Please try again or provide more specific instructions.'
						);
					}
				}
				return;
			}
		}

		// Handle step regeneration feedback (legacy support)
		if (waitingForStepFeedback && currentRegeneratingStepIndex >= 0) {
			if (!userInput.trim()) {
				await sendBotMessage("Please provide feedback on what you'd like to change.");
				return;
			}
			await handleRegenerateStep(currentRegeneratingStepIndex, userInput.trim(), false);
			waitingForStepFeedback = false;
			currentRegeneratingStepIndex = -1;
			userInput = '';
			return;
		}

		// NEW: Handle initial prompt
		if (waitingForInitialPrompt) {
			if (!userInput.trim()) return;

			await sendUserMessage(userInput.trim());
			const prompt = userInput.trim();
			userInput = '';
			waitingForInitialPrompt = false;

			await delay(500);
			await analyzePromptAndGenerateQuestions(prompt);
			return;
		}

		// Handle initial confirmation
		if (waitingForConfirmation) {
			if (!userInput.trim()) return;

			await sendUserMessage(userInput.trim());
			userInput = '';

			// Check for positive responses
			if (
				input === 'yes' ||
				input === 'y' ||
				input === 'yeah' ||
				input === 'sure' ||
				input === 'ok' ||
				input === 'okay' ||
				input === "let's go" ||
				input === 'start' ||
				input === 'ready'
			) {
				waitingForConfirmation = false;
				await delay(500);
				await askNextQuestion();
			} else if (input === 'no' || input === 'n' || input === 'nope' || input === 'not yet') {
				await delay(500);
				await sendBotMessage(
					"No problem! Take your time. Just type 'yes' when you're ready to begin! 😊"
				);
			} else {
				await delay(500);
				await sendBotMessage(
					"I didn't quite catch that. Please type 'yes' to start or 'no' if you need more time."
				);
			}
			return;
		}

		// Handle regular question answers
		const questionsToUse = allQuestions.length > 0 ? allQuestions : questions;

		// Check if we're on the logo question and waiting for acceptance
		if (currentQuestionIndex >= 0 && currentQuestionIndex < questionsToUse.length) {
			const currentQuestion = questionsToUse[currentQuestionIndex];
			if (currentQuestion && currentQuestion.type === 'logo' && waitingForLogoAcceptance) {
				// User is on logo question and logo is pending acceptance
				// Check if user is providing feedback for regeneration
				if (userMessage && userMessage.trim()) {
					// User is providing feedback - handle regeneration
					if (currentLogoMessageId) {
						await handleRegenerateLogo(currentLogoMessageId, userMessage);
						userInput = '';
						return;
					}
				} else {
					await sendBotMessage(
						'⚠️ Please accept the generated logo or provide feedback to regenerate it. Use the buttons above the logo or type your feedback.'
					);
					return;
				}
			}
		}

		// Safety check: if we're in question mode, ensure currentQuestion exists
		if (currentQuestionIndex >= 0 && currentQuestionIndex < questionsToUse.length) {
			if (!userInput.trim()) {
				const q = questionsToUse[currentQuestionIndex];
				if (q && q.required) {
					await sendBotMessage('⚠️ This field is required. Please provide an answer.');
					return;
				}
			}

			if (userInput.trim()) {
				const currentQuestion = questionsToUse[currentQuestionIndex];
				if (!currentQuestion) {
					console.error('Current question is undefined at index:', currentQuestionIndex);
					return;
				}

				// Don't allow text input for logo question if waiting for acceptance
				if (currentQuestion.type === 'logo' && waitingForLogoAcceptance) {
					await sendBotMessage(
						'⚠️ Please accept the generated logo or provide feedback to regenerate it. Use the buttons above the logo or type your feedback.'
					);
					userInput = '';
					return;
				}

				answers[currentQuestion.id] = userInput.trim();

				// Update collectedInfo for essential fields
				if (currentQuestion.id === 'brandName') collectedInfo.brandName = userInput.trim();
				if (currentQuestion.id === 'industry') {
					collectedInfo.industry = userInput.trim();
					// Industry changed, we'll get industry questions after this question
					await ensureGroundingDataForIndustry(userInput.trim());
				}
				if (currentQuestion.id === 'style') collectedInfo.style = userInput.trim();

				// If we were editing, update the existing message
				if (isEditingMode) {
					// Find and update the existing message for this question
					const messageIndex = messages.findIndex(
						(m) => m.type === 'user' && m.questionIndex === currentQuestionIndex
					);

					if (messageIndex !== -1) {
						// Update the existing message content
						messages[messageIndex] = {
							...messages[messageIndex],
							content: userInput.trim(),
							edited: true
						};
						messages = [...messages]; // Trigger reactivity
					}

					userInput = '';
					isMultiline = false;
					isEditingMode = false;
					showSuggestions = false;
					currentSuggestions = [];
					editingQuestionIndex = -1;

					// Restore to where we were before editing
					if (returnToQuestionIndex >= 0) {
						currentQuestionIndex = returnToQuestionIndex;
						returnToQuestionIndex = -1;

						// Restore the UI state for the current question
						if (currentQuestionIndex < questions.length) {
							const currentQ = questions[currentQuestionIndex];
							isMultiline = currentQ.type === 'textarea';
							showSuggestions = currentQ.type === 'text-with-suggestions';
							if (showSuggestions && currentQ.suggestions) {
								currentSuggestions = currentQ.suggestions;
							}
						}
					}

					// If conversation is complete, update the summary
					if (conversationComplete) {
						await updateSummary();
					}

					await scrollToBottom();
				} else {
					// Normal flow - create new message and move to next question
					await sendUserMessage(userInput.trim(), currentQuestionIndex);
					userInput = '';
					isMultiline = false;

					await delay(500);
					await askNextQuestion();
				}
			}
		} else if (userInput.trim() && !waitingForInitialPrompt && !waitingForConfirmation) {
			// Free-form chat mode: allow user to send messages at any time (like a normal chatbot)
			// This handles cases where user wants to ask questions or provide additional info
			// OR start a completely new brand guideline generation

			const prompt = userInput.trim();
			await sendUserMessage(prompt);
			userInput = '';

			// Show typing indicator
			isTyping = true;
			await delay(500);

			// Analyze the prompt and respond accordingly
			try {
				// If conversation is complete, treat this as a new brand guideline request
				// but keep previous messages for context/history
				if (conversationComplete && !isGeneratingGuidelines) {
					await sendBotMessage(
						"🆕 Starting a fresh plan—I'll keep our previous conversation for reference."
					);
					conversationComplete = false;
				}

				// Analyze the prompt deeply
				await analyzePromptAndGenerateQuestions(prompt);
			} catch (error) {
				console.error('Error handling free-form prompt:', error);
				await sendBotMessage(
					"I'm here to help you create brand guidelines. Please answer the questions above, or describe what you'd like to create!"
				);
			} finally {
				isTyping = false;
			}
		}
	}

	// Handle suggestion chip click
	async function handleSuggestionClick(suggestion: string) {
		const questionsToUse = allQuestions.length > 0 ? allQuestions : questions;
		const currentQuestion = questionsToUse[currentQuestionIndex];
		answers[currentQuestion.id] = suggestion;

		// Update collectedInfo for essential fields
		if (currentQuestion.id === 'brandName') collectedInfo.brandName = suggestion;
		if (currentQuestion.id === 'industry') {
			collectedInfo.industry = suggestion;
			// Industry changed, we'll get industry questions after this question
			await ensureGroundingDataForIndustry(suggestion);
		}
		if (currentQuestion.id === 'style') collectedInfo.style = suggestion;

		// If we were editing, update the existing message
		if (isEditingMode) {
			// Find and update the existing message for this question
			const messageIndex = messages.findIndex(
				(m) => m.type === 'user' && m.questionIndex === currentQuestionIndex
			);

			if (messageIndex !== -1) {
				// Update the existing message content
				messages[messageIndex] = {
					...messages[messageIndex],
					content: suggestion,
					edited: true
				};
				messages = [...messages]; // Trigger reactivity
			}

			userInput = '';
			showSuggestions = false;
			currentSuggestions = [];
			isEditingMode = false;
			editingQuestionIndex = -1;

			// Restore to where we were before editing
			if (returnToQuestionIndex >= 0) {
				currentQuestionIndex = returnToQuestionIndex;
				returnToQuestionIndex = -1;

				// Restore the UI state for the current question
				if (currentQuestionIndex < questions.length) {
					const currentQ = questions[currentQuestionIndex];
					isMultiline = currentQ.type === 'textarea';
					showSuggestions = currentQ.type === 'text-with-suggestions';
					if (showSuggestions && currentQ.suggestions) {
						currentSuggestions = currentQ.suggestions;
					}
				}
			}

			// If conversation is complete, update the summary
			if (conversationComplete) {
				await updateSummary();
			}

			await scrollToBottom();
		} else {
			// Normal flow - create new message and move to next question
			await sendUserMessage(suggestion, currentQuestionIndex);
			userInput = '';
			showSuggestions = false;

			await delay(500);
			await askNextQuestion();
		}
	}

	// Handle skip
	async function handleSkip() {
		const questionsToUse = allQuestions.length > 0 ? allQuestions : questions;
		const currentQuestion = questionsToUse[currentQuestionIndex];
		if (currentQuestion.required) return;

		await sendUserMessage('_[Skipped]_');
		await delay(500);
		await askNextQuestion();
	}

	// Handle logo upload
	async function handleLogoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];

			if (!file.type.startsWith('image/')) {
				await sendBotMessage('⚠️ Please select a valid image file.');
				return;
			}

			if (file.size > 5 * 1024 * 1024) {
				await sendBotMessage('⚠️ File size must be less than 5MB.');
				return;
			}

			logoFile = file;

			// Upload to server first
			try {
				const formData = new FormData();
				formData.append('logo', file);

				const response = await fetch('/api/upload-logo', {
					method: 'POST',
					body: formData
				});

				if (response.ok) {
					const result = await response.json();

					// Store the server response with persisted data
					logoPreview = result.fileUrl;
					answers['logo'] = {
						filename: result.filename,
						filePath: result.fileUrl,
						fileData: result.fileUrl,
						fileUrl: result.fileUrl,
						storageId: result.storageId,
						mimeType: result.mimeType,
						usageTag: 'primary'
					};

					await sendUserMessage(`📎 Uploaded: ${file.name}`);
					await delay(500);
					// Logo uploaded - mark as accepted and proceed
					if (answers['logo']) {
						answers['logo'].status = 'accepted';
					}
					await persistLogoSnapshot('upload');
					waitingForLogoAcceptance = false;
					currentLogoMessageId = null;
					await askNextQuestion();
				} else {
					const error = await response.json();
					await sendBotMessage(`⚠️ Failed to upload logo: ${error.error || 'Unknown error'}`);
				}
			} catch (error) {
				console.error('Logo upload error:', error);
				await sendBotMessage('⚠️ Failed to upload logo. Please try again.');
			}
		}
	}

	// Trigger file input
	function triggerFileUpload() {
		fileInput?.click();
	}

	// Handle AI logo generation
	async function handleGenerateLogo() {
		await sendUserMessage('🎨 Generate logo with AI', currentQuestionIndex);
		await delay(500);
		await sendBotMessage(
			"🎨 Great! I'm generating a professional logo for you based on all your brand details. This will take a moment..."
		);

		// Collect all available information
		const brandName = collectedInfo.brandName || answers['brandName'] || '';
		const industry = collectedInfo.industry || answers['industry'] || '';
		const style = collectedInfo.style || answers['style'] || '';
		const audience = collectedInfo.audience || answers['audience'] || '';
		const description = collectedInfo.description || answers['shortDescription'] || '';
		const values = collectedInfo.values || answers['brandValues'] || '';

		if (!brandName) {
			await sendBotMessage(
				'⚠️ I need at least a brand name to generate your logo. Please provide your brand name first.'
			);
			return;
		}

		try {
			isTyping = true;
			await scrollToBottom();

			// Call the logo generation API with all collected information
			const response = await fetch('/api/generate-logo', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brandName,
					industry,
					style,
					description,
					values,
					audience,
					// Include any industry-specific info from answers
					...Object.fromEntries(
						Object.entries(answers).filter(
							([key]) =>
								![
									'logo',
									'brandName',
									'industry',
									'style',
									'audience',
									'shortDescription',
									'brandValues'
								].includes(key)
						)
					)
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to generate logo');
			}

		const result = await response.json();

		if (result.success && result.logoUrl && result.logoId) {
				// Store the generated logo (but don't mark as accepted yet)
				answers['logo'] = {
					type: 'ai-generated',
				fileData: result.logoUrl,
				fileUrl: result.logoUrl,
				storageId: result.logoId,
				filename: result.filename || `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`,
					status: 'pending-acceptance'
				};

			logoPreview = result.logoUrl;

				// Send bot message with the logo image displayed and waiting for acceptance
				const logoMessage = await sendBotMessage(
					"✨ Perfect! I've generated a professional logo for your brand. Please review it below and let me know if you'd like to accept it or make any changes.",
					undefined,
					undefined,
					undefined,
				result.logoUrl
				);
				currentLogoMessageId = logoMessage.id;
				waitingForLogoAcceptance = true;

				// Update the message to mark it as waiting for acceptance
				messages = messages.map((m) =>
					m.id === logoMessage.id
						? { ...m, waitingForLogoAcceptance: true, logoAccepted: false }
						: m
				);

				// Don't proceed to next question until logo is accepted
			} else {
				throw new Error(result.error || 'Failed to generate logo');
			}
		} catch (error: any) {
			console.error('Logo generation error:', error);
			await sendBotMessage(
				`⚠️ I encountered an issue generating your logo: ${error.message || 'Unknown error'}. You can still upload your own logo or we'll generate it during the brand guidelines creation process.`
			);
			// Mark as pending so it can be generated later
			answers['logo'] = {
				type: 'ai-generated',
				status: 'pending'
			};
			// Don't proceed to next question - let user try again or upload logo
			waitingForLogoAcceptance = false;
		} finally {
			isTyping = false;
		}
	}

	// Finish conversation and show summary
	async function finishConversation() {
		// Check if logo question exists and if it's been answered/accepted
		const hasLogoQuestion = allQuestions.find((q) => q.id === 'logo');
		const logoAnswer = answers['logo'];
		const isLogoAccepted =
			logoAnswer &&
			(logoAnswer.status === 'accepted' ||
				logoAnswer.status === 'generated' ||
				(logoAnswer.type !== 'ai-generated' && logoAnswer.fileData));

		// If logo question exists but hasn't been accepted, don't finish yet
		if (hasLogoQuestion && !isLogoAccepted) {
			console.log('[finishConversation] Logo question exists but not accepted yet, waiting...');
			return;
		}

		// If logo question doesn't exist and we're done with all questions, add it
		if (!hasLogoQuestion && hasFetchedIndustryQuestions) {
			allQuestions.push({
				id: 'logo',
				question: 'Do you have a logo, or would you like us to generate one with AI?',
				type: 'logo',
				required: true,
				icon: '🖼️',
				helper: 'Upload your existing logo or let AI create one based on your brand details'
			});
			await askNextQuestion();
			return; // Don't finish yet, wait for logo answer
		}

		conversationComplete = true;
		await delay(500);
		await sendBotMessage(
			"🎉 **All done!** I've collected all the information needed to generate your brand guidelines."
		);
		await delay(1000);

		// Build summary from both collectedInfo and answers
		const summaryData: Record<string, any> = {};

		// Add collectedInfo first (from prompt analysis)
		if (collectedInfo.brandName) summaryData.brandName = collectedInfo.brandName;
		if (collectedInfo.industry) summaryData.industry = collectedInfo.industry;
		if (collectedInfo.style) summaryData.style = collectedInfo.style;
		if (collectedInfo.audience) summaryData.audience = collectedInfo.audience;

		// Add answers (from questions), but don't overwrite if already in summaryData
		Object.entries(answers).forEach(([key, value]) => {
			if (value && key !== 'logo' && !summaryData[key]) {
				summaryData[key] = value;
			}
		});

		// Also ensure essential fields from answers are included (they might override collectedInfo if user answered)
		if (answers['brandName']) summaryData.brandName = answers['brandName'];
		if (answers['industry']) summaryData.industry = answers['industry'];
		if (answers['style']) summaryData.style = answers['style'];

		await sendBotMessage(
			"Here's a quick summary of what you provided:\n\n" +
				Object.entries(summaryData)
					.filter(([key, value]) => value && key !== 'logo')
					.map(
						([key, value]) =>
							`• **${key}**: ${typeof value === 'string' ? value.substring(0, 50) : value}`
					)
					.join('\n') +
				'\n\n_💡 Tip: You can hover over any of your answers above and click the edit icon to make changes!_'
		);
		await delay(1000);
		await sendBotMessage(
			'✨ Ready to generate your comprehensive brand guidelines? Click the button below!'
		);
	}

	// Handle generation
	function handleGenerate() {
		generationAbortController = new AbortController();

		// Use collectedInfo and answers to build formData
		const brandName = collectedInfo.brandName || answers['brandName'] || '';
		const industry = collectedInfo.industry || answers['industry'] || '';
		const style = collectedInfo.style || answers['style'] || '';
		const audience = collectedInfo.audience || answers['audience'] || '';
		const description = collectedInfo.description || answers['shortDescription'] || '';
		const values = collectedInfo.values || answers['brandValues'] || '';

		// Build industry-specific info from answers
		const industrySpecificInfo: Record<string, any> = {};
		industryQuestions.forEach((q) => {
			if (answers[q.id]) {
				industrySpecificInfo[q.id] = answers[q.id];
			}
		});

		// Map industry to brandDomain (required by progressive generation)
		const brandDomain = industry || answers['brandDomain'] || '';

		// Generate shortDescription if not provided
		// Combine brand info into a meaningful description
		let shortDescription = description;
		if (!shortDescription) {
			const descriptionParts: string[] = [];
			if (brandName) descriptionParts.push(brandName);
			if (industry) descriptionParts.push(`a ${industry} company`);
			if (style) descriptionParts.push(`with a ${style} aesthetic`);
			if (audience) {
				descriptionParts.push(`targeting ${audience}`);
			}
			shortDescription =
				descriptionParts.length > 0
					? descriptionParts.join(', ')
					: `${brandName || 'A brand'} in the ${industry || 'business'} industry`;
		}

		// Format logo data properly
		let logoData = answers['logo'];
		if (logoData && logoData.type === 'ai-generated' && logoData.fileData) {
			// Ensure AI-generated logo has proper format
			logoData = {
				type: 'ai-generated',
				fileData: logoData.fileData,
				filename: logoData.filename || `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`,
				status: 'generated'
			};
		}

		// Map answers back to the expected format
		const formData = {
			brandName: brandName,
			brandDomain: brandDomain, // Industry is used as brandDomain
			shortDescription: shortDescription, // Auto-generated if not provided
			brandValues: values,
			selectedMood: style || answers['selectedMood'] || '', // Style is used as mood
			selectedAudience: audience || answers['selectedAudience'] || '',
			contactName: answers['contactName'] || '',
			contactEmail: answers['contactEmail'] || '',
			contactRole: answers['contactRole'] || '',
			contactCompany: answers['contactCompany'] || '',
			customPrompt: answers['customPrompt'] || collectedInfo.description || '',
			logoData: logoData, // Properly formatted logo data
			groundingData: groundingData,
			// Include industry-specific info so progressive generator can use it
			industrySpecificInfo: industrySpecificInfo
		};

		isGeneratingGuidelines = true;
		onComplete(formData);
	}

	// Export function to clear chat state (for reset)
	export function clearChatState() {
		// Abort any ongoing fetch requests first
		if (generationAbortController) {
			generationAbortController.abort();
			generationAbortController = null;
		}

		// Clear all auto-approve timeouts
		autoApproveTimeouts.forEach((timeout) => clearTimeout(timeout));
		autoApproveTimeouts.clear();

		// Reset all state variables
		messages = [];
		currentQuestionIndex = -1;
		answers = {};
		conversationComplete = false;
		waitingForConfirmation = false;
		isGeneratingGuidelines = false;
		waitingForStepFeedback = false;
		currentRegeneratingStepIndex = -1;
		isEditingMode = false;
		editingQuestionIndex = -1;
		returnToQuestionIndex = -1;
		userInput = '';
		isMultiline = false;
		showSuggestions = false;
		currentSuggestions = [];
		isTyping = false;

		// Clear new state variables - CRITICAL: Set waitingForInitialPrompt to true
		waitingForInitialPrompt = true;
		isAnalyzingPrompt = false;
		promptAnalysis = null;
		industryQuestions = [];
		allQuestions = [];
		hasFetchedIndustryQuestions = false;
		collectedInfo = {};
		groundingData = null;
		groundingIndustry = null;
		isFetchingGroundingData = false;
		hasAnnouncedGrounding = false;
		waitingForLogoAcceptance = false;
		currentLogoMessageId = null;

		// Clear input element references
		textInput = null;
		textareaInput = null;
		logoPreview = null;
		logoFile = null;

		// Clear sessionStorage (browser only)
		try {
			if (typeof window !== 'undefined' && window.sessionStorage) {
				const { messagesKey, stateKey } = getStorageKeys();
				sessionStorage.removeItem(messagesKey);
				sessionStorage.removeItem(stateKey);
			}
		} catch (error) {
			console.error('Failed to clear chat state:', error);
		}

		// Send initial welcome message after clearing - use tick to ensure state is updated
		tick().then(async () => {
			await delay(300);
			await sendBotMessage(
				"👋 Hi! I'm your Brand Builder Assistant. I'll help you create comprehensive brand guidelines.\n\n**Please describe what you'd like to create.** You can tell me about your brand name, industry, style preferences, or any other details you have in mind. I'll analyze your input and ask any additional questions needed!"
			);
			await scrollToBottom();
		});
	}

	// Handle step generation event (called from ProgressiveGenerator)
	export async function handleStepGenerated(step: {
		stepId: string;
		stepTitle: string;
		stepDescription: string;
		content: any;
		stepIndex: number;
		isGenerating: boolean;
		isApproved: boolean;
	}) {
		// Find if this step already exists in messages
		const existingMessageIndex = messages.findIndex(
			(m) => m.type === 'step' && m.stepData?.stepIndex === step.stepIndex
		);

		const stepMessage: ChatMessage = {
			id: `step-${step.stepIndex}-${Date.now()}`,
			type: 'step',
			content: '', // Will be rendered from stepData
			timestamp: new Date(),
			stepData: {
				stepId: step.stepId,
				stepTitle: step.stepTitle,
				stepDescription: step.stepDescription,
				content: step.content,
				stepIndex: step.stepIndex,
				isGenerating: step.isGenerating,
				isApproved: step.isApproved
			}
		};

		if (existingMessageIndex !== -1) {
			// Update existing step message
			messages[existingMessageIndex] = stepMessage;
			messages = [...messages]; // Trigger reactivity
		} else {
			// Append new step message so it appears after the approval confirmation
			messages = [...messages, stepMessage];
		}

		// Step generated - no automatic message (user can see the step and approve/change as needed)

		scrollToBottom();
	}

	// Handle step approval
	async function handleApproveStep(stepIndex: number) {
		if (!onApproveStep) return;

		// Cancel auto-approval if it exists
		cancelAutoApprove(stepIndex);

		// Check if step is still generating - don't allow approval
		const messageIndex = messages.findIndex(
			(m) => m.type === 'step' && m.stepData?.stepIndex === stepIndex
		);

		if (messageIndex !== -1) {
			const stepMessage = messages[messageIndex];
			if (stepMessage.stepData?.isGenerating || !stepMessage.stepData?.content) {
				await sendBotMessage('⏳ Please wait for the step to finish generating before approving.');
				return;
			}
		}

		// Update message to show approved state
		if (messageIndex !== -1) {
			messages[messageIndex] = {
				...messages[messageIndex],
				stepData: {
					...messages[messageIndex].stepData!,
					isApproved: true
				}
			};
			messages = [...messages];
		}

		// Determine if this is the final step
		const isLastStep = totalSteps ? stepIndex >= totalSteps - 1 : false;

		if (isLastStep) {
			await delay(300);
			await sendBotMessage(
				'✅ Final step approved! Would you like to save your brand guidelines now?'
			);

			await delay(700);
			onApproveStep(stepIndex);
		} else {
			// Show approval message immediately, before next step appears
			await delay(300);
			await sendBotMessage('✅ Step approved! Generating next step...');

			// Small pause before triggering next step generation
			await delay(700);

			// Call the approve function (this will trigger next step generation)
			onApproveStep(stepIndex);
		}
	}

	// Natural language processing for step commands
	function parseStepCommand(userMessage: string): {
		action: 'approve' | 'change' | 'modify' | 'add' | 'remove' | 'update' | 'regenerate' | null;
		stepIndex: number | null;
		feedback: string | null;
		isCompleteReplacement: boolean;
	} {
		const lowerMessage = userMessage.toLowerCase().trim();

		// Find step references by number (e.g., "step 1", "first step", "step one")
		let stepIndex: number | null = null;
		const stepNumberMatch = lowerMessage.match(
			/(?:step|#)\s*(\d+)|(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+step/i
		);
		if (stepNumberMatch) {
			const num = stepNumberMatch[1]
				? parseInt(stepNumberMatch[1])
				: [
						'first',
						'second',
						'third',
						'fourth',
						'fifth',
						'sixth',
						'seventh',
						'eighth',
						'ninth',
						'tenth'
					].indexOf(stepNumberMatch[0].split(' ')[0]) + 1;
			if (num > 0) stepIndex = num - 1; // Convert to 0-based index
		}

		// Find step references by name/keywords and step titles
		const stepKeywords: Record<string, number> = {
			'brand positioning': 0,
			positioning: 0,
			logo: 1,
			'logo guidelines': 1,
			color: 2,
			'color palette': 2,
			colors: 2,
			typography: 3,
			font: 3,
			fonts: 3,
			iconography: 4,
			icons: 4,
			icon: 4
		};

		if (stepIndex === null) {
			// First try keyword matching
			for (const [keyword, idx] of Object.entries(stepKeywords)) {
				if (lowerMessage.includes(keyword)) {
					// Check if this step exists in messages
					const stepExists = messages.some(
						(m) => m.type === 'step' && m.stepData?.stepIndex === idx && !m.stepData?.isApproved
					);
					if (stepExists) {
						stepIndex = idx;
						break;
					}
				}
			}

			// If still not found, try matching by step title
			if (stepIndex === null) {
				for (const message of messages) {
					if (message.type === 'step' && message.stepData && !message.stepData.isApproved) {
						const stepTitle = message.stepData.stepTitle?.toLowerCase() || '';
						const stepDesc = message.stepData.stepDescription?.toLowerCase() || '';

						// Check if user message contains words from step title or description
						const titleWords = stepTitle.split(/\s+/).filter((w) => w.length > 3);
						const descWords = stepDesc.split(/\s+/).filter((w) => w.length > 3);

						const hasTitleMatch = titleWords.some((word) => lowerMessage.includes(word));
						const hasDescMatch = descWords.some((word) => lowerMessage.includes(word));

						if (hasTitleMatch || hasDescMatch) {
							stepIndex = message.stepData.stepIndex;
							break;
						}
					}
				}
			}
		}

		// If no specific step mentioned, use the most recent unapproved step
		if (stepIndex === null) {
			const unapprovedSteps = messages
				.filter(
					(m) =>
						m.type === 'step' && m.stepData && !m.stepData.isApproved && !m.stepData.isGenerating
				)
				.map((m) => m.stepData!.stepIndex);
			if (unapprovedSteps.length > 0) {
				stepIndex = unapprovedSteps[unapprovedSteps.length - 1]; // Most recent
			}
		}

		// Detect action
		let action:
			| 'approve'
			| 'change'
			| 'modify'
			| 'add'
			| 'remove'
			| 'update'
			| 'regenerate'
			| null = null;
		const approveKeywords = [
			'approve',
			'looks good',
			'perfect',
			'yes',
			'ok',
			'okay',
			'fine',
			'good',
			'great',
			'accept',
			'keep it',
			'that works'
		];
		const changeKeywords = [
			'change',
			'modify',
			'update',
			'edit',
			'adjust',
			'fix',
			'correct',
			'revise',
			'redo',
			'regenerate',
			'remake'
		];
		const addKeywords = ['add', 'include', 'insert', 'append'];
		const removeKeywords = ['remove', 'delete', 'omit', 'exclude', 'drop'];

		if (approveKeywords.some((kw) => lowerMessage.includes(kw))) {
			action = 'approve';
		} else if (changeKeywords.some((kw) => lowerMessage.includes(kw))) {
			action =
				lowerMessage.includes('regenerate') ||
				lowerMessage.includes('remake') ||
				lowerMessage.includes('redo completely')
					? 'regenerate'
					: 'change';
		} else if (addKeywords.some((kw) => lowerMessage.includes(kw))) {
			action = 'add';
		} else if (removeKeywords.some((kw) => lowerMessage.includes(kw))) {
			action = 'remove';
		}

		// Detect if user wants complete replacement (only if explicitly stated)
		// By default, modifications are partial - only regenerate completely if user explicitly says so
		// Check for very explicit complete replacement phrases
		const explicitCompletePhrases = [
			'completely regenerate',
			'completely remake',
			'completely redo',
			'entirely regenerate',
			'entirely remake',
			'start over',
			'redo completely',
			'regenerate completely',
			'remake completely',
			'change everything',
			'replace everything',
			'redo everything',
			'start from scratch',
			'completely change',
			'completely replace'
		];

		const isCompleteReplacement = explicitCompletePhrases.some((phrase) =>
			lowerMessage.includes(phrase)
		);

		// Extract feedback (everything after action keywords)
		let feedback: string | null = null;
		if (action && action !== 'approve') {
			const actionIndex = Math.max(
				...changeKeywords.map((kw) => lowerMessage.indexOf(kw)).filter((i) => i >= 0),
				...addKeywords.map((kw) => lowerMessage.indexOf(kw)).filter((i) => i >= 0),
				...removeKeywords.map((kw) => lowerMessage.indexOf(kw)).filter((i) => i >= 0)
			);
			if (actionIndex >= 0) {
				feedback = userMessage
					.substring(actionIndex)
					.replace(
						/^(change|modify|update|edit|adjust|fix|correct|revise|redo|regenerate|remake|add|include|insert|append|remove|delete|omit|exclude|drop)\s+/i,
						''
					)
					.trim();
				if (!feedback || feedback.length < 3) feedback = null;
			}
		}

		return { action, stepIndex, feedback, isCompleteReplacement };
	}

	// Setup auto-approval for a step
	function setupAutoApprove(stepIndex: number) {
		// Clear any existing timeout for this step
		if (autoApproveTimeouts.has(stepIndex)) {
			clearTimeout(autoApproveTimeouts.get(stepIndex)!);
		}

		// Set new timeout
		const timeout = setTimeout(async () => {
			// Check if user is currently typing (don't auto-approve if they're active)
			if (userInput.trim().length > 0) {
				// User is typing, reset the timeout
				setupAutoApprove(stepIndex);
				return;
			}

			const stepMessage = messages.find(
				(m) =>
					m.type === 'step' &&
					m.stepData?.stepIndex === stepIndex &&
					!m.stepData?.isApproved &&
					!m.stepData?.isGenerating
			);

			if (stepMessage && stepMessage.stepData) {
				await handleApproveStep(stepIndex);
			}

			autoApproveTimeouts.delete(stepIndex);
		}, AUTO_APPROVE_DELAY);

		autoApproveTimeouts.set(stepIndex, timeout);
	}

	// Cancel auto-approval for a step
	function cancelAutoApprove(stepIndex: number) {
		if (autoApproveTimeouts.has(stepIndex)) {
			clearTimeout(autoApproveTimeouts.get(stepIndex)!);
			autoApproveTimeouts.delete(stepIndex);
		}
	}

	// Handle step regeneration with feedback
	async function handleRegenerateStep(
		stepIndex: number,
		feedback: string,
		isCompleteReplacement: boolean = false
	) {
		if (!onRegenerateStep || !feedback.trim()) {
			return;
		}

		// Cancel auto-approval for this step
		cancelAutoApprove(stepIndex);

		// Get the current step content to preserve it
		const stepMessage = messages.find(
			(m) => m.type === 'step' && m.stepData?.stepIndex === stepIndex
		);
		const currentStepContent = stepMessage?.stepData?.content || '';

		// Enhance feedback based on whether it's a complete replacement or partial modification
		let enhancedFeedback = feedback;
		if (!isCompleteReplacement && feedback) {
			// For partial modifications, instruct AI to preserve existing content and only change what's mentioned
			enhancedFeedback = `IMPORTANT: Analyze the user's request carefully and ONLY modify the specific thing they mentioned. Preserve ALL other existing content exactly as it is.

USER REQUEST: "${feedback}"

INSTRUCTIONS:
1. Read the current step content below
2. Identify EXACTLY what the user wants to change (analyze their request)
3. Make ONLY that specific change
4. Keep everything else exactly the same
5. Do NOT regenerate or rewrite the entire step
6. Do NOT add new content unless the user explicitly asked to add something
7. Do NOT remove content unless the user explicitly asked to remove something

CURRENT STEP CONTENT:
${typeof currentStepContent === 'string' ? currentStepContent.substring(0, 2000) : JSON.stringify(currentStepContent).substring(0, 2000)}

Now make ONLY the specific change requested by the user: "${feedback}"`;
		} else if (isCompleteReplacement) {
			enhancedFeedback = `Please completely regenerate this step with the following requirements: ${feedback}`;
		}

		// Update message to show regenerating state
		const messageIndex = messages.findIndex(
			(m) => m.type === 'step' && m.stepData?.stepIndex === stepIndex
		);

		if (messageIndex !== -1) {
			messages[messageIndex] = {
				...messages[messageIndex],
				stepData: {
					...messages[messageIndex].stepData!,
					isGenerating: true,
					isApproved: false
				}
			};
			messages = [...messages];
		}

		// Call the regenerate function
		onRegenerateStep(stepIndex, enhancedFeedback);

		await delay(300);
		await sendBotMessage(
			`🔄 ${isCompleteReplacement ? 'Regenerating' : 'Updating'} step with your feedback...`
		);
	}

	// Handle Enter key
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			// Enter without Shift = Submit
			event.preventDefault();
			handleSubmit();
		}
		// Shift+Enter = New line (default textarea behavior)
	}

	// Check if current question is optional
	$: isCurrentQuestionOptional =
		currentQuestionIndex >= 0 ? !questions[currentQuestionIndex]?.required : false;

	// Progress percentage
	$: progressPercentage =
		currentQuestionIndex >= 0
			? Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
			: 0;

	// Check if we can generate based on collected info and answers
	$: internalCanGenerate = (() => {
		const brandName = collectedInfo.brandName || answers['brandName'] || '';
		const industry = collectedInfo.industry || answers['industry'] || '';
		const style = collectedInfo.style || answers['style'] || '';
		const hasLogo = answers['logo'] !== undefined && answers['logo'] !== null;

		// We can generate if we have brand name, industry, style, and logo
		return brandName.trim() !== '' && industry.trim() !== '' && style.trim() !== '' && hasLogo;
	})();

	// Use internal canGenerate if available, otherwise fall back to prop
	$: effectiveCanGenerate = internalCanGenerate || canGenerate;

	// Clear chat messages only (keeps conversation state)
	function clearChatMessages() {
		// Abort any ongoing operations
		if (generationAbortController) {
			generationAbortController.abort();
			generationAbortController = null;
		}

		// Reset processing states
		isAnalyzingPrompt = false;
		isTyping = false;
		isFetchingGroundingData = false;

		// Clear messages
		messages = [];

		// Clear sessionStorage messages (browser only)
		try {
			if (typeof window !== 'undefined' && window.sessionStorage) {
				const { messagesKey, stateKey } = getStorageKeys();
				sessionStorage.removeItem(messagesKey);
				sessionStorage.setItem(stateKey, JSON.stringify(buildPersistedState()));
			}
		} catch (error) {
			console.error('Failed to clear chat messages:', error);
		}

		scrollToBottom();
	}
</script>

<Card
	class="flex h-[1000px] w-[580px] flex-col !gap-0 overflow-hidden border-border/50 border-orange-500/20 bg-card/50 !py-0 shadow-xl backdrop-blur-sm"
>
	<CardHeader class="flex-shrink-0 space-y-4 border-b border-border/50 bg-primary/20 p-6">
		<!-- Header -->
		<div class="flex flex-col items-center justify-center gap-2 text-center">
			<div>
				<h2 class="text-2xl font-bold text-foreground">Brand Builder Assistant</h2>
				<p class="text-xs" style="color: #000000;">AI-powered questionnaire</p>
			</div>
		</div>
	</CardHeader>

	<CardContent class="flex flex-1 flex-col overflow-hidden bg-background p-0">
		<!-- Messages Container -->
		<div
			bind:this={chatContainer}
			class="flex-1 space-y-4 overflow-y-auto scroll-smooth bg-background p-6"
		>
			{#each messages as message (message.id)}
				{#if message.type === 'step'}
					{#if message.stepData}
						<!-- Step Message -->
						<div class="flex items-start gap-3">
							<div
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600"
							>
								<Bot class="h-5 w-5 text-white" />
							</div>
							<div class="flex-1 space-y-3">
								<div class="space-y-3 rounded-lg border border-border/50 bg-card p-4">
									<div class="space-y-1">
										<h3 class="font-semibold text-foreground">{message.stepData.stepTitle}</h3>
										<p class="text-sm text-muted-foreground">{message.stepData.stepDescription}</p>
									</div>

									{#if message.stepData.isGenerating || !message.stepData.content}
										<div class="flex items-center gap-2 text-sm text-muted-foreground">
											<div
												class="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"
											></div>
											<span>Generating step content...</span>
										</div>
									{:else if message.stepData.content}
										<div
											class="max-h-60 overflow-y-auto text-sm whitespace-pre-wrap text-foreground"
										>
											{typeof message.stepData.content === 'string'
												? message.stepData.content.substring(0, 500) +
													(message.stepData.content.length > 500 ? '...' : '')
												: JSON.stringify(message.stepData.content, null, 2).substring(0, 500) +
													'...'}
										</div>

										{#if !message.stepData.isApproved && !message.stepData.isGenerating && message.stepData.content}
											<div class="flex items-center gap-2 border-t border-border/50 pt-2">
												<Button
													onclick={() => handleApproveStep(message.stepData!.stepIndex)}
													class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
													size="sm"
												>
													<CheckCircle class="mr-2 h-4 w-4" />
													Approve
												</Button>
											</div>
										{:else if message.stepData.isApproved}
											<div class="flex items-center gap-2 border-t border-border/50 pt-2">
												<div class="flex items-center gap-2 text-sm text-green-600">
													<CheckCircle class="h-4 w-4" />
													<span>Approved</span>
												</div>
											</div>
										{/if}
									{/if}
								</div>
							</div>
						</div>
					{/if}
				{:else if message.type === 'user' || message.type === 'bot'}
					{@const safeMessage = message as ChatMessage & { type: 'user' | 'bot' }}
					{@const shouldShowEdit =
						!waitingForConfirmation &&
						safeMessage.type === 'user' &&
						safeMessage.questionIndex !== undefined &&
						safeMessage.questionIndex >= 0}
					<ChatMessage
						message={safeMessage}
						canEdit={shouldShowEdit}
						onEdit={() => {
							if (safeMessage.questionIndex !== undefined && safeMessage.questionIndex >= 0) {
								handleEditAnswer(safeMessage.questionIndex);
							}
						}}
						onAcceptLogo={(messageId) => handleAcceptLogo(messageId)}
						onRegenerateLogo={(messageId, feedback) => {
							handleRegenerateLogo(messageId, feedback);
						}}
					/>
				{/if}
			{/each}

			{#if isFetchingGroundingData}
				<div class="grounding-indicator">
					<div class="grounding-dots">
						<span class="grounding-dot delay-0"></span>
						<span class="grounding-dot delay-1"></span>
						<span class="grounding-dot delay-2"></span>
					</div>
					<span class="grounding-text">
						Researching {collectedInfo.industry || answers['industry'] || 'industry'} sites…
					</span>
				</div>
			{/if}

			{#if isTyping}
				<TypingIndicator />
			{/if}

			<!-- Suggestion Chips -->
			{#if showSuggestions && currentSuggestions.length > 0 && (!conversationComplete || isEditingMode)}
				<SuggestionChips suggestions={currentSuggestions} onSelect={handleSuggestionClick} />
			{/if}
		</div>

		<!-- Input Area -->
		<div class="flex-shrink-0 space-y-3 border-t border-border/50 bg-primary/20 p-4">
			<!-- Edit Mode Indicator -->
			{#if isEditingMode && editingQuestionIndex >= 0}
				{@const questionsToUse = allQuestions.length > 0 ? allQuestions : questions}
				{@const editingQuestion = questionsToUse[editingQuestionIndex]}
				{#if editingQuestion}
					<div
						class="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 p-3"
					>
						<Edit2 class="h-4 w-4 text-orange-500" />
						<span class="text-sm text-foreground">
							Editing: <strong>{editingQuestion.question}</strong>
						</span>
					</div>
				{/if}
			{/if}

			<!-- Logo Options UI -->
			{#if !waitingForConfirmation && currentQuestionIndex >= 0 && !conversationComplete}
				{@const questionsToUse = allQuestions.length > 0 ? allQuestions : questions}
				{#if questionsToUse[currentQuestionIndex]?.type === 'logo'}
					<div class="space-y-3">
						<div class="grid grid-cols-2 gap-3">
							<Button
								onclick={triggerFileUpload}
								variant="outline"
								class="flex-1 border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/10"
								size="lg"
							>
								<Upload class="mr-2 h-5 w-5" />
								Upload Logo
							</Button>
							<Button
								onclick={handleGenerateLogo}
								variant="outline"
								class="flex-1 border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/10"
								size="lg"
							>
								<Sparkles class="mr-2 h-5 w-5" />
								Generate with AI
							</Button>
						</div>
						<!-- Skip button removed for logo - logo is required -->
					</div>
					<input
						bind:this={fileInput}
						type="file"
						class="hidden"
						accept="image/*"
						onchange={handleLogoUpload}
					/>
				{/if}
			{/if}

			<!-- Regular Input - Always show input field, even after conversation complete -->
			{#if !waitingForConfirmation || conversationComplete}
				<div class="flex items-end gap-2">
					{#if isMultiline && !waitingForConfirmation}
						<Textarea
							bind:ref={textareaInput}
							bind:value={userInput}
							placeholder={conversationComplete
								? 'Add more details or ask questions about your brand...'
								: 'Type your answer...'}
							rows={3}
							class="flex-1 resize-none"
							onkeydown={handleKeyPress}
						/>
					{:else}
						<Input
							bind:ref={textInput}
							bind:value={userInput}
							placeholder={waitingForInitialPrompt
								? "Describe your brand (e.g., 'Create brand for TechFlow, SaaS company, minimalistic')..."
								: waitingForConfirmation
									? "Type 'yes' to start..."
									: waitingForStepFeedback
										? "Describe what you'd like to change..."
										: isEditingMode
											? 'Edit your answer...'
											: isGeneratingGuidelines
												? "Type to approve steps or request changes (e.g., 'approve', 'change the colors', 'make it more modern')..."
												: conversationComplete
													? 'Add more details or ask questions about your brand...'
													: 'Type your answer...'}
							class="flex-1 text-base"
							onkeydown={handleKeyPress}
						/>
					{/if}
					<Button
						onclick={handleSubmit}
						disabled={!userInput.trim() &&
							(waitingForStepFeedback ||
								(!waitingForInitialPrompt &&
									!waitingForConfirmation &&
									!conversationComplete &&
									currentQuestionIndex >= 0 &&
									(allQuestions.length > 0
										? allQuestions[currentQuestionIndex]
										: questions[currentQuestionIndex]
									)?.required))}
						class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
						size="lg"
					>
						{#if isEditingMode}
							<Edit2 class="h-5 w-5" />
						{:else}
							<Send class="h-5 w-5" />
						{/if}
					</Button>
					{#if isEditingMode}
						<Button
							variant="ghost"
							onclick={() => {
								isEditingMode = false;
								editingQuestionIndex = -1;
								userInput = '';
								showSuggestions = false;
								currentSuggestions = [];

								// Restore to where we were before editing
								if (returnToQuestionIndex >= 0) {
									currentQuestionIndex = returnToQuestionIndex;
									returnToQuestionIndex = -1;

									// Restore the UI state for the current question
									const questionsToUse = allQuestions.length > 0 ? allQuestions : questions;
									if (currentQuestionIndex >= 0 && currentQuestionIndex < questionsToUse.length) {
										const currentQ = questionsToUse[currentQuestionIndex];
										isMultiline = currentQ.type === 'textarea';
										showSuggestions = currentQ.type === 'text-with-suggestions';
										if (showSuggestions && currentQ.suggestions) {
											currentSuggestions = currentQ.suggestions;
										}
									}
								}
							}}
							size="lg"
						>
							Cancel
						</Button>
					{:else if !waitingForConfirmation && !conversationComplete && isCurrentQuestionOptional}
						<Button variant="ghost" onclick={handleSkip} size="lg">Skip</Button>
					{/if}
				</div>
				<!-- Keyboard Shortcuts Hint -->
				<div class="mt-2 text-left text-xs text-muted-foreground">
					<kbd class="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">Enter</kbd> to
					send •
					<kbd class="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">Shift</kbd> +
					<kbd class="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">Enter</kbd> for new
					line
				</div>
			{/if}

			<!-- Generate Button (shown after conversation complete, but not when editing) -->
			{#if conversationComplete && !isEditingMode && !waitingForStepFeedback && !isGeneratingGuidelines && !userInput.trim()}
				<Button
					onclick={handleGenerate}
					disabled={!effectiveCanGenerate}
					class="mt-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg hover:from-orange-600 hover:to-orange-700"
					size="lg"
				>
					<Sparkles class="mr-2 h-5 w-5" />
					Generate Brand Guidelines
				</Button>
			{/if}
		</div>
	</CardContent>
</Card>

<style>
	.grounding-indicator {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-left: 2.25rem;
		margin-top: 0.1rem;
		font-size: 0.78rem;
		color: var(--muted-foreground);
	}

	:global(.dark) .grounding-indicator {
		color: rgba(226, 232, 240, 0.9);
	}

	.grounding-dots {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.grounding-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		background: rgba(249, 115, 22, 0.8);
		animation: grounding-bounce 1.2s infinite ease-in-out;
	}

	.grounding-dot.delay-1 {
		animation-delay: 0.2s;
	}

	.grounding-dot.delay-2 {
		animation-delay: 0.4s;
	}

	@keyframes grounding-bounce {
		0%,
		80%,
		100% {
			transform: scale(0.6);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.grounding-text {
		font-size: 0.85rem;
		color: inherit;
	}
</style>
