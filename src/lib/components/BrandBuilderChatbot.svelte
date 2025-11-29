<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import {
		Send,
		Upload,
		Bot,
		Edit2,
		CheckCircle,
		Sparkles,
		StopCircle,
		RotateCcw
	} from 'lucide-svelte';
	import ChatMessage from './ChatMessage.svelte';
	import TypingIndicator from './TypingIndicator.svelte';
	import SuggestionChips from './SuggestionChips.svelte';
	import { getEssentialQuestions } from '$lib/services/industry-questions';

	// ============================================================================
	// TYPES
	// ============================================================================

	type MessageType = 'bot' | 'user' | 'step';
	type ChatPhase = 'initial' | 'analyzing' | 'questioning' | 'complete' | 'generating';
	type LogoStatus = 'none' | 'uploading' | 'generating' | 'pending-acceptance' | 'accepted';

	interface ChatMessage {
		id: string;
		type: MessageType;
		content: string;
		timestamp: Date;
		questionId?: string;
		suggestions?: string[];
		inputType?: string;
		isLogo?: boolean;
		questionIndex?: number;
		edited?: boolean;
		logoData?: string;
		stepData?: StepData;
		waitingForLogoAcceptance?: boolean;
		logoAccepted?: boolean;
	}

	interface StepData {
		stepId: string;
		stepTitle: string;
		stepDescription: string;
		content: any;
		stepIndex: number;
		isGenerating: boolean;
		isApproved: boolean;
	}

	interface Question {
		id: string;
		question: string;
		type: string;
		required?: boolean;
		suggestions?: string[];
		icon?: string;
		helper?: string;
	}

	interface CollectedInfo {
		brandName?: string;
		industry?: string;
		style?: string;
		audience?: string;
		description?: string;
		values?: string;
	}

	interface ChatState {
		phase: ChatPhase;
		questionIndex: number;
		isEditing: boolean;
		editingIndex: number;
		returnToIndex: number;
		logoStatus: LogoStatus;
		currentLogoMessageId: string | null;
	}

	// ============================================================================
	// PROPS
	// ============================================================================

	export let questions: Question[] = [];
	export let onComplete: (data: any) => void;
	export let canGenerate: boolean;
	export let onApproveStep: ((stepIndex: number) => void) | null = null;
	export let onRegenerateStep: ((stepIndex: number, feedback: string) => void) | null = null;
	export let totalSteps: number = 7;
	export let storageKey: string | null = null;
	export let onSessionSave: ((payload: { id: string; brandName?: string; messages: any[]; state: any }) => void) | null = null;

	// ============================================================================
	// STATE - Consolidated into logical groups
	// ============================================================================

	// Core chat state
	let chatState: ChatState = {
		phase: 'initial',
		questionIndex: -1,
		isEditing: false,
		editingIndex: -1,
		returnToIndex: -1,
		logoStatus: 'none',
		currentLogoMessageId: null
	};

	// Messages and answers
	let messages: ChatMessage[] = [];
	let answers: Record<string, any> = {};
	let collectedInfo: CollectedInfo = {};

	// Questions management
	let allQuestions: Question[] = [];
	let industryQuestions: Question[] = [];
	let hasFetchedIndustryQuestions = false;

	// UI state
	let userInput = '';
	let isTyping = false;
	let showSuggestions = false;
	let currentSuggestions: string[] = [];
	let isMultiline = false;

	// Grounding data
	let groundingData: any = null;
	let groundingIndustry: string | null = null;
	let isFetchingGroundingData = false;

	// DOM refs
	let chatContainer: HTMLElement;
	let fileInput: HTMLInputElement;
	let inputElement: HTMLInputElement | HTMLTextAreaElement | null = null;

	// Controllers and timers
	let abortController: AbortController | null = null;
	let autoApproveTimers = new Map<number, ReturnType<typeof setTimeout>>();
	let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	const AUTO_APPROVE_DELAY = 10000;
	const SAVE_DEBOUNCE_MS = 400;
	const TYPING_DELAY = 600;

	// ============================================================================
	// COMPUTED VALUES
	// ============================================================================

	$: questionsToUse = allQuestions.length > 0 ? allQuestions : questions;
	$: currentQuestion = chatState.questionIndex >= 0 && chatState.questionIndex < questionsToUse.length
		? questionsToUse[chatState.questionIndex]
		: null;
	$: isLogoQuestion = currentQuestion?.type === 'logo';
	$: isCurrentQuestionOptional = currentQuestion ? !currentQuestion.required : false;
	$: progressPercentage = chatState.questionIndex >= 0
		? Math.round(((chatState.questionIndex + 1) / questionsToUse.length) * 100)
		: 0;

	$: effectiveCanGenerate = (() => {
		const brandName = collectedInfo.brandName || answers['brandName'] || '';
		const industry = collectedInfo.industry || answers['industry'] || '';
		const style = collectedInfo.style || answers['style'] || '';
		const hasLogo = answers['logo'] != null;
		return brandName.trim() !== '' && industry.trim() !== '' && style.trim() !== '' && hasLogo;
	})() || canGenerate;

	// ============================================================================
	// STORAGE HELPERS
	// ============================================================================

	function getStorageKeys() {
		const suffix = storageKey ? `:${storageKey}` : '';
		return {
			messagesKey: `brandBuilderChatMessages${suffix}`,
			stateKey: `brandBuilderChatState${suffix}`
		};
	}

	function serializeMessages(msgs: ChatMessage[]) {
		return msgs.map(msg => ({
			...msg,
			timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
		}));
	}

	function buildPersistedState() {
		return {
			chatState,
			answers,
			collectedInfo,
			allQuestions,
			hasFetchedIndustryQuestions,
			groundingData,
			groundingIndustry
		};
	}

	function saveState() {
		if (typeof window === 'undefined') return;

		if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
		saveDebounceTimer = setTimeout(() => {
			try {
				const { messagesKey, stateKey } = getStorageKeys();
				const serializedMessages = serializeMessages(messages);
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
			} catch (error) {
				console.error('[Chatbot] Failed to save state:', error);
			}
		}, SAVE_DEBOUNCE_MS);
	}

	function loadState(): boolean {
		if (typeof window === 'undefined') return false;

		try {
			const { messagesKey, stateKey } = getStorageKeys();
			const savedMessages = sessionStorage.getItem(messagesKey);
			const savedState = sessionStorage.getItem(stateKey);

			if (!savedMessages || !savedState) return false;

			const parsedMessages = JSON.parse(savedMessages);
			const parsedState = JSON.parse(savedState);

			messages = parsedMessages.map((msg: any) => ({
				...msg,
				timestamp: new Date(msg.timestamp)
			}));

			chatState = parsedState.chatState ?? chatState;
			answers = parsedState.answers ?? {};
			collectedInfo = parsedState.collectedInfo ?? {};
			allQuestions = parsedState.allQuestions ?? [];
			hasFetchedIndustryQuestions = parsedState.hasFetchedIndustryQuestions ?? false;
			groundingData = parsedState.groundingData ?? null;
			groundingIndustry = parsedState.groundingIndustry ?? null;

			// Reset any stuck processing states
			isTyping = false;
			isFetchingGroundingData = false;

			return true;
		} catch (error) {
			console.error('[Chatbot] Failed to load state:', error);
			clearStoredState();
			return false;
		}
	}

	function clearStoredState() {
		if (typeof window === 'undefined') return;

		try {
			const { messagesKey, stateKey } = getStorageKeys();
			sessionStorage.removeItem(messagesKey);
			sessionStorage.removeItem(stateKey);
		} catch (error) {
			console.error('[Chatbot] Failed to clear state:', error);
		}
	}

	// Auto-save on state changes
	$: if (messages.length >= 0) saveState();

	// ============================================================================
	// UTILITIES
	// ============================================================================

	function delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	async function scrollToBottom() {
		if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
		scrollDebounceTimer = setTimeout(async () => {
			await tick();
			if (chatContainer) {
				chatContainer.scrollTo({
					top: chatContainer.scrollHeight,
					behavior: 'smooth'
				});
			}
		}, 50);
	}

	function focusInput() {
		setTimeout(() => {
			if (inputElement && document.activeElement !== inputElement) {
				inputElement.focus();
			}
		}, 100);
	}

	function cancelAllAutoApproves() {
		autoApproveTimers.forEach(timer => clearTimeout(timer));
		autoApproveTimers.clear();
	}

	function abortOngoingRequests() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
	}

	// ============================================================================
	// MESSAGE HANDLING
	// ============================================================================

	async function addBotMessage(
		content: string,
		options: {
			questionId?: string;
			suggestions?: string[];
			inputType?: string;
			logoData?: string;
		} = {}
	): Promise<ChatMessage> {
		isTyping = true;
		await scrollToBottom();
		await delay(TYPING_DELAY);

		const message: ChatMessage = {
			id: generateId(),
			type: 'bot',
			content,
			timestamp: new Date(),
			...options,
			isLogo: options.inputType === 'logo'
		};

		messages = [...messages, message];
		isTyping = false;

		// Update suggestions state
		if (options.suggestions?.length) {
			showSuggestions = true;
			currentSuggestions = options.suggestions;
		} else {
			showSuggestions = false;
			currentSuggestions = [];
		}

		isMultiline = options.inputType === 'textarea';
		await scrollToBottom();

		return message;
	}

	async function addUserMessage(content: string, questionIndex?: number): Promise<ChatMessage> {
		const message: ChatMessage = {
			id: generateId(),
			type: 'user',
			content,
			timestamp: new Date(),
			questionIndex: questionIndex ?? chatState.questionIndex
		};

		messages = [...messages, message];
		await scrollToBottom();

		return message;
	}

	// ============================================================================
	// API CALLS
	// ============================================================================

	async function fetchWithAbort<T>(
		url: string,
		options: RequestInit = {}
	): Promise<T> {
		abortController = new AbortController();

		const response = await fetch(url, {
			...options,
			signal: abortController.signal
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
		}

		return response.json();
	}

	async function fetchGroundingData(industry: string) {
		if (!industry?.trim() || isFetchingGroundingData) return;

		const normalizedIndustry = industry.trim();
		if (groundingIndustry?.toLowerCase() === normalizedIndustry.toLowerCase() && groundingData) {
			return;
		}

		isFetchingGroundingData = true;

		try {
			await addBotMessage(`Researching successful ${normalizedIndustry} brands to tailor your questions...`);

			const result = await fetchWithAbort<{ groundingData: any }>('/api/grounding-search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ industry: normalizedIndustry })
			});

			if (result?.groundingData) {
				groundingData = result.groundingData;
				groundingIndustry = normalizedIndustry;
				await addBotMessage(
					`Analyzed ${groundingData.websites?.length || 0} ${normalizedIndustry} brands. I'll use these insights for better questions.`
				);
			}
		} catch (error) {
			if (error instanceof Error && error.name !== 'AbortError') {
				console.error('[Chatbot] Grounding search failed:', error);
			}
		} finally {
			isFetchingGroundingData = false;
		}
	}

	async function analyzePrompt(prompt: string) {
		chatState.phase = 'analyzing';
		await addBotMessage('Analyzing your input...');

		try {
			const result = await fetchWithAbort<{ success: boolean; analysis: any; error?: string }>(
				'/api/brand-builder/analyze-prompt',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userPrompt: prompt })
				}
			);

			if (!result.success || !result.analysis) {
				throw new Error(result.error || 'Invalid response from analysis API');
			}

			const analysis = result.analysis;

			// Reset collected info and answers for fresh extraction
			collectedInfo = {};
			answers = {};

			// Store extracted info in BOTH collectedInfo AND answers
			// This ensures getEssentialQuestions knows what's already been answered
			const extractedBrandName = analysis.brandName?.trim() || '';
			const extractedIndustry = analysis.industry?.trim() || '';
			const extractedStyle = analysis.style?.trim() || '';
			const extractedAudience = analysis.audience?.trim() || '';
			const extractedDescription = analysis.description?.trim() || '';
			const extractedValues = analysis.values?.trim() || '';

			if (extractedBrandName) {
				collectedInfo.brandName = extractedBrandName;
				answers['brandName'] = extractedBrandName;
			}
			if (extractedIndustry) {
				collectedInfo.industry = extractedIndustry;
				answers['industry'] = extractedIndustry;
			}
			if (extractedStyle) {
				// Normalize style to one of the four allowed values
				const normalizedStyle = normalizeStyle(extractedStyle);
				if (normalizedStyle) {
					// Only set if it's one of the 4 valid options
					const validStyles = ['Minimalistic', 'Maximalistic', 'Funky', 'Futuristic'];
					if (validStyles.includes(normalizedStyle)) {
						collectedInfo.style = normalizedStyle;
						answers['style'] = normalizedStyle;
					}
					// If normalized but not in valid list, don't set it (will ask user)
				}
				// If couldn't normalize, don't set it (will ask user)
			}
			if (extractedAudience) {
				collectedInfo.audience = extractedAudience;
				answers['audience'] = extractedAudience;
			}
			if (extractedDescription) {
				collectedInfo.description = extractedDescription;
				answers['description'] = extractedDescription;
			}
			if (extractedValues) {
				collectedInfo.values = extractedValues;
				answers['brandValues'] = extractedValues;
			}

			// Fetch grounding data if we have industry
			if (collectedInfo.industry) {
				await fetchGroundingData(collectedInfo.industry);
			}

			// Generate questions ONLY for missing info
			// Note: If style was mentioned but couldn't be normalized to one of the 4 valid options,
			// collectedInfo.style will be undefined, and getEssentialQuestions will add a style question
			// with the 4 options (Minimalistic, Maximalistic, Funky, Futuristic)
			const essentialQuestions = getEssentialQuestions({
				brandName: collectedInfo.brandName,
				industry: collectedInfo.industry,
				style: collectedInfo.style
			});

			// Use extracted information directly without confirmation
			// Only show a brief message if we're proceeding to questions
			if (essentialQuestions.length > 0) {
				await addBotMessage("Let me ask a few questions to complete your brand profile.");
				await delay(300);
			} else {
				await addBotMessage("I have all the essential info! Let me ask a few follow-up questions.");
				await delay(300);
			}

			// Clear any previous suggestions before starting questions
			showSuggestions = false;
			currentSuggestions = [];

			allQuestions = [...essentialQuestions];
			chatState.phase = 'questioning';
			chatState.questionIndex = -1;
			hasFetchedIndustryQuestions = false;

			// IMPORTANT: Wait for Svelte reactivity to update questionsToUse before proceeding
			// Otherwise questionsToUse might still reference the old questions prop
			await tick();

			if (allQuestions.length > 0) {
				await askNextQuestion();
			} else {
				// All essential info already extracted, go to industry questions
				await completeQuestioning();
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return;

			console.error('[Chatbot] Prompt analysis error:', error);
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';

			let userMessage = 'I encountered an error analyzing your prompt. ';
			if (errorMsg.includes('API key')) {
				userMessage += 'The AI service is not properly configured.';
			} else {
				userMessage += 'Please try again with more details.';
			}

			await addBotMessage(userMessage);
			chatState.phase = 'initial';
		}
	}

	// Helper to normalize style to one of the four allowed values
	function normalizeStyle(style: string): string | null {
		const lower = style.toLowerCase();

		// Direct matches
		if (lower === 'minimalistic' || lower === 'minimal' || lower === 'minimalist') return 'Minimalistic';
		if (lower === 'maximalistic' || lower === 'maximal' || lower === 'maximalist') return 'Maximalistic';
		if (lower === 'funky' || lower === 'fun') return 'Funky';
		if (lower === 'futuristic' || lower === 'future') return 'Futuristic';

		// Keyword matches
		if (lower.includes('minimalistic') || lower.includes('minimal') || lower.includes('clean') || lower.includes('simple') || lower.includes('sleek') || lower.includes('elegant')) {
			return 'Minimalistic';
		}
		if (lower.includes('maximalistic') || lower.includes('maximal') || lower.includes('bold') || lower.includes('busy') || lower.includes('ornate') || lower.includes('elaborate')) {
			return 'Maximalistic';
		}
		if (lower.includes('funky') || lower.includes('playful') || lower.includes('quirky') || lower.includes('creative') || lower.includes('colorful') || lower.includes('vibrant') || lower.includes('fun')) {
			return 'Funky';
		}
		if (lower.includes('futuristic') || lower.includes('modern') || lower.includes('tech') || lower.includes('innovative') || lower.includes('cutting-edge') || lower.includes('high-tech')) {
			return 'Futuristic';
		}

		// If the API returned one of the exact values, use it
		if (style === 'Minimalistic' || style === 'Maximalistic' || style === 'Funky' || style === 'Futuristic') {
			return style;
		}

		return null; // Style not recognized, will ask user
	}

	// ============================================================================
	// QUESTION FLOW
	// ============================================================================

	async function askNextQuestion() {
		// Don't proceed if waiting for logo acceptance
		if (chatState.logoStatus === 'pending-acceptance') return;

		chatState.questionIndex++;

		// Check if we've completed all questions
		if (chatState.questionIndex >= questionsToUse.length) {
			if (!hasFetchedIndustryQuestions) {
				await fetchIndustryQuestions();
			} else {
				await ensureLogoQuestionAndFinish();
			}
			return;
		}

		const question = questionsToUse[chatState.questionIndex];
		if (!question) {
			console.error('[Chatbot] Question undefined at index:', chatState.questionIndex);
			await finishConversation();
			return;
		}

		await delay(300);

		let questionText = `${question.icon || '?'} **${question.question}**`;
		if (question.helper) {
			questionText += `\n\n_${question.helper}_`;
		}

		// Pass suggestions for text-with-suggestions type questions
		const questionSuggestions = question.type === 'text-with-suggestions' && question.suggestions?.length
			? question.suggestions
			: undefined;

		await addBotMessage(questionText, {
			questionId: question.id,
			suggestions: questionSuggestions,
			inputType: question.type
		});

		focusInput();
	}

	async function fetchIndustryQuestions() {
		const industry = collectedInfo.industry || answers['industry'];
		if (!industry) {
			await ensureLogoQuestionAndFinish();
			return;
		}

		hasFetchedIndustryQuestions = true;
		await fetchGroundingData(industry);
		await delay(300);
		await addBotMessage(`Now let me ask a few ${industry}-specific questions for more accurate guidelines.`);

		try {
			const result = await fetchWithAbort<{ questions: Question[] }>(
				'/api/brand-builder/industry-questions',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						industry,
						existingInfo: {
							brandName: collectedInfo.brandName || answers['brandName'],
							style: collectedInfo.style || answers['style'],
							audience: collectedInfo.audience || answers['audience']
						},
						alreadyAskedQuestionIds: allQuestions.map(q => q.id),
						groundingData
					})
				}
			);

			const newQuestions = result.questions || [];
			const existingIds = new Set(allQuestions.map(q => q.id));
			const uniqueQuestions = newQuestions.filter(q => !existingIds.has(q.id));

			if (uniqueQuestions.length > 0) {
				industryQuestions = uniqueQuestions;
				allQuestions = [...allQuestions, ...uniqueQuestions];
				await tick(); // Wait for reactivity before asking next question
				await askNextQuestion();
			} else {
				await ensureLogoQuestionAndFinish();
			}
		} catch (error) {
			if (error instanceof Error && error.name !== 'AbortError') {
				console.error('[Chatbot] Industry questions error:', error);
			}
			await ensureLogoQuestionAndFinish();
		}
	}

	async function ensureLogoQuestionAndFinish() {
		const hasLogoQuestion = allQuestions.some(q => q.id === 'logo');
		const logoAnswer = answers['logo'];
		const isLogoAccepted = logoAnswer &&
			(logoAnswer.status === 'accepted' || logoAnswer.status === 'generated' ||
			(logoAnswer.type !== 'ai-generated' && logoAnswer.fileData));

		if (!hasLogoQuestion) {
			// Clear any remaining suggestions before asking logo question
			showSuggestions = false;
			currentSuggestions = [];

			// Add a transition message before logo question
			await addBotMessage("Great! I have all the information I need about your brand. Now let's set up your logo.");
			await delay(400);

			// Add logo question to allQuestions
			const logoQuestion: Question = {
				id: 'logo',
				question: 'Do you have a logo, or would you like us to generate one with AI?',
				type: 'logo',
				required: true,
				icon: '🖼️',
				helper: 'Upload your existing logo or let AI create one based on your brand details'
			};

			// Calculate the new index before adding the question
			const newIndex = allQuestions.length;

			// Add question to array
			allQuestions = [...allQuestions, logoQuestion];

			// Ensure we're in questioning phase and logo status is ready
			chatState.phase = 'questioning';
			chatState.logoStatus = 'none';

			// Set the question index to point to the logo question
			chatState.questionIndex = newIndex;

			// Wait for ALL reactive updates to propagate
			await tick();
			await tick(); // Double tick to ensure nested reactivity

			console.log('[Chatbot] Logo question setup:', {
				questionIndex: chatState.questionIndex,
				questionsToUseLength: questionsToUse.length,
				allQuestionsLength: allQuestions.length,
				phase: chatState.phase,
				logoStatus: chatState.logoStatus,
				currentQuestionType: currentQuestion?.type,
				currentQuestionId: currentQuestion?.id,
				isLogoQuestion
			});

			// Display the logo question
			let questionText = `${logoQuestion.icon} **${logoQuestion.question}**`;
			if (logoQuestion.helper) {
				questionText += `\n\n_${logoQuestion.helper}_`;
			}

			await addBotMessage(questionText, {
				questionId: logoQuestion.id,
				inputType: logoQuestion.type
			});

			// Wait for UI to update after message is added
			await tick();

			focusInput();
		} else if (!isLogoAccepted) {
			// Logo question exists but not answered
			return;
		} else {
			await finishConversation();
		}
	}

	async function completeQuestioning() {
		if (!hasFetchedIndustryQuestions) {
			await fetchIndustryQuestions();
		} else {
			await ensureLogoQuestionAndFinish();
		}
	}

	async function finishConversation() {
		// Verify logo is accepted before finishing
		const logoAnswer = answers['logo'];
		const isLogoAccepted = logoAnswer &&
			(logoAnswer.status === 'accepted' || logoAnswer.status === 'generated' ||
			(logoAnswer.type !== 'ai-generated' && logoAnswer.fileData));

		if (allQuestions.some(q => q.id === 'logo') && !isLogoAccepted) {
			return;
		}

		chatState.phase = 'complete';
		await delay(300);
		await addBotMessage("**All done!** I've collected all the information needed to generate your brand guidelines.");
		await delay(500);

		// Build summary
		const summary: Record<string, any> = { ...collectedInfo };
		Object.entries(answers).forEach(([key, value]) => {
			if (value && key !== 'logo' && !summary[key]) {
				summary[key] = value;
			}
		});

		// Override with direct answers
		if (answers['brandName']) summary.brandName = answers['brandName'];
		if (answers['industry']) summary.industry = answers['industry'];
		if (answers['style']) summary.style = answers['style'];

		const summaryText = Object.entries(summary)
			.filter(([key, value]) => value && key !== 'logo')
			.map(([key, value]) => `- **${key}**: ${typeof value === 'string' ? value.substring(0, 50) : value}`)
			.join('\n');

		await addBotMessage(
			"**Summary:**\n\n" + summaryText +
			"\n\n_Tip: Hover over your answers above and click edit to make changes._"
		);
		await delay(500);
		await addBotMessage("Ready to generate your brand guidelines? Click the button below!");
	}

	// ============================================================================
	// INPUT HANDLING
	// ============================================================================

	async function handleSubmit() {
		const trimmedInput = userInput.trim();
		if (!trimmedInput && chatState.phase !== 'initial') return;

		const input = trimmedInput.toLowerCase();

		// Handle logo feedback
		if (chatState.logoStatus === 'pending-acceptance' && chatState.currentLogoMessageId && trimmedInput) {
			await handleLogoRegenerate(chatState.currentLogoMessageId, trimmedInput);
			userInput = '';
			return;
		}

		// Handle initial prompt
		if (chatState.phase === 'initial') {
			if (!trimmedInput) return;
			await addUserMessage(trimmedInput);
			userInput = '';
			await analyzePrompt(trimmedInput);
			return;
		}

		// Handle step commands during generation
		if (chatState.phase === 'generating' && trimmedInput) {
			cancelAllAutoApproves();
			const command = parseStepCommand(trimmedInput);

			if (command.stepIndex !== null) {
				await addUserMessage(trimmedInput);
				userInput = '';

				if (command.action === 'approve') {
					await handleApproveStep(command.stepIndex);
				} else if (command.action && command.feedback) {
					await handleRegenerateStep(command.stepIndex, command.feedback, command.isCompleteReplacement);
				} else {
					await addBotMessage('What would you like me to do with this step? You can approve it or request changes.');
				}
				return;
			}
		}

		// Handle question answers
		if (chatState.phase === 'questioning' && currentQuestion) {
			// Check for logo question with pending acceptance
			if (currentQuestion.type === 'logo' && chatState.logoStatus === 'pending-acceptance') {
				if (trimmedInput) {
					await handleLogoRegenerate(chatState.currentLogoMessageId!, trimmedInput);
					userInput = '';
				}
				return;
			}

			// Required field validation
			if (!trimmedInput && currentQuestion.required) {
				await addBotMessage('This field is required. Please provide an answer.');
				return;
			}

			if (trimmedInput) {
				await processAnswer(trimmedInput);
			}
		}

		// Handle post-completion input (new brand request)
		if (chatState.phase === 'complete' && trimmedInput) {
			await addUserMessage(trimmedInput);
			userInput = '';

			// Reset for new brand
			chatState.phase = 'initial';
			answers = {};
			allQuestions = [];
			hasFetchedIndustryQuestions = false;

			await addBotMessage("Starting fresh - I'll keep our previous conversation for reference.");
			await analyzePrompt(trimmedInput);
		}
	}

	async function processAnswer(answer: string) {
		if (!currentQuestion) return;

		// Clear suggestions immediately when processing an answer
		showSuggestions = false;
		currentSuggestions = [];

		answers[currentQuestion.id] = answer;

		// Update collected info for key fields
		if (currentQuestion.id === 'brandName') collectedInfo.brandName = answer;
		if (currentQuestion.id === 'industry') {
			collectedInfo.industry = answer;
			await fetchGroundingData(answer);
		}
		if (currentQuestion.id === 'style') collectedInfo.style = answer;

		if (chatState.isEditing) {
			await finishEditing(answer);
		} else {
			await addUserMessage(answer, chatState.questionIndex);
			userInput = '';
			isMultiline = false;
			await delay(300);
			await askNextQuestion();
		}
	}

	async function finishEditing(answer: string) {
		// Update the existing message
		const msgIndex = messages.findIndex(
			m => m.type === 'user' && m.questionIndex === chatState.questionIndex
		);

		if (msgIndex !== -1) {
			messages[msgIndex] = {
				...messages[msgIndex],
				content: answer,
				edited: true
			};
			messages = [...messages];
		}

		userInput = '';
		isMultiline = false;
		chatState.isEditing = false;
		chatState.editingIndex = -1;
		showSuggestions = false;
		currentSuggestions = [];

		// Restore position
		if (chatState.returnToIndex >= 0) {
			chatState.questionIndex = chatState.returnToIndex;
			chatState.returnToIndex = -1;
			updateUIForCurrentQuestion();
		}

		// Update summary if conversation was complete
		if (chatState.phase === 'complete') {
			await updateSummary();
		}

		await scrollToBottom();
	}

	function updateUIForCurrentQuestion() {
		if (currentQuestion) {
			isMultiline = currentQuestion.type === 'textarea';
			showSuggestions = currentQuestion.type === 'text-with-suggestions';
			currentSuggestions = showSuggestions && currentQuestion.suggestions ? currentQuestion.suggestions : [];
		}
	}

	async function updateSummary() {
		const summaryIndex = messages.findIndex(m => m.type === 'bot' && m.content.includes('**All done!**'));
		if (summaryIndex !== -1) {
			messages = messages.slice(0, summaryIndex);
			await finishConversation();
		}
	}

	async function handleSuggestionClick(suggestion: string) {
		// Immediately hide suggestions after selection
		showSuggestions = false;
		currentSuggestions = [];
		await processAnswer(suggestion);
	}

	async function handleSkip() {
		if (currentQuestion?.required) return;
		// Clear suggestions when skipping
		showSuggestions = false;
		currentSuggestions = [];
		await addUserMessage('_[Skipped]_');
		await delay(300);
		await askNextQuestion();
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}

	// ============================================================================
	// EDITING
	// ============================================================================

	async function handleEditAnswer(questionIndex: number) {
		if (questionIndex < 0 || questionIndex >= questionsToUse.length) return;

		const question = questionsToUse[questionIndex];
		if (!question) return;

		chatState.returnToIndex = chatState.questionIndex;
		chatState.isEditing = true;
		chatState.editingIndex = questionIndex;
		chatState.questionIndex = questionIndex;

		// Pre-fill with previous answer
		const previousAnswer = answers[question.id];
		userInput = typeof previousAnswer === 'string' ? previousAnswer : '';

		updateUIForCurrentQuestion();
		await scrollToBottom();
		focusInput();
	}

	function cancelEditing() {
		chatState.isEditing = false;
		chatState.editingIndex = -1;
		userInput = '';
		showSuggestions = false;
		currentSuggestions = [];

		if (chatState.returnToIndex >= 0) {
			chatState.questionIndex = chatState.returnToIndex;
			chatState.returnToIndex = -1;
			updateUIForCurrentQuestion();
		}
	}

	// ============================================================================
	// LOGO HANDLING
	// ============================================================================

	function triggerFileUpload() {
		fileInput?.click();
	}

	async function handleLogoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			await addBotMessage('Please select a valid image file.');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			await addBotMessage('File size must be less than 5MB.');
			return;
		}

		chatState.logoStatus = 'uploading';

		try {
			const formData = new FormData();
			formData.append('logo', file);

			const response = await fetch('/api/upload-logo', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Upload failed');
			}

			const result = await response.json();

			answers['logo'] = {
				filename: result.filename,
				filePath: result.filePath,
				fileData: result.fileData,
				status: 'accepted',
				usageTag: 'primary'
			};

			chatState.logoStatus = 'accepted';
			await addUserMessage(`Uploaded: ${file.name}`);
			await delay(300);
			await askNextQuestion();
		} catch (error) {
			console.error('[Chatbot] Logo upload error:', error);
			chatState.logoStatus = 'none';
			await addBotMessage(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async function handleGenerateLogo() {
		const brandName = collectedInfo.brandName || answers['brandName'] || '';
		if (!brandName) {
			await addBotMessage('I need at least a brand name to generate your logo.');
			return;
		}

		await addUserMessage('Generate logo with AI', chatState.questionIndex);
		await delay(300);
		await addBotMessage("Generating a professional logo for your brand. This will take a moment...");

		chatState.logoStatus = 'generating';
		isTyping = true;

		try {
			const result = await fetchWithAbort<{ success: boolean; logoData: string; filename?: string; error?: string }>(
				'/api/generate-logo',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						brandName,
						industry: collectedInfo.industry || answers['industry'] || '',
						style: collectedInfo.style || answers['style'] || '',
						description: collectedInfo.description || answers['shortDescription'] || '',
						values: collectedInfo.values || answers['brandValues'] || '',
						audience: collectedInfo.audience || answers['audience'] || ''
					})
				}
			);

			// Handle both logoData (base64) and logoUrl response formats
			const logoData = result.logoData || result.logoUrl;
			if (!result.success || !logoData) {
				throw new Error(result.error || 'Failed to generate logo');
			}

			answers['logo'] = {
				type: 'ai-generated',
				fileData: logoData,
				filename: result.filename || `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`,
				status: 'pending-acceptance'
			};

			const logoMessage = await addBotMessage(
				"I've generated a logo for your brand. Please review it and let me know if you'd like to accept it or make changes.",
				{ logoData: logoData }
			);

			chatState.logoStatus = 'pending-acceptance';
			chatState.currentLogoMessageId = logoMessage.id;

			messages = messages.map(m =>
				m.id === logoMessage.id
					? { ...m, waitingForLogoAcceptance: true, logoAccepted: false }
					: m
			);
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return;

			console.error('[Chatbot] Logo generation error:', error);
			chatState.logoStatus = 'none';
			await addBotMessage(
				`Logo generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. You can upload your own logo instead.`
			);
		} finally {
			isTyping = false;
		}
	}

	async function handleLogoAccept(messageId: string) {
		messages = messages.map(m =>
			m.id === messageId ? { ...m, logoAccepted: true, waitingForLogoAcceptance: false } : m
		);

		if (answers['logo']) {
			answers['logo'].status = 'accepted';
		}

		chatState.logoStatus = 'accepted';
		chatState.currentLogoMessageId = null;

		await addBotMessage("Logo saved! It will be used in your brand guidelines.");
		await delay(300);

		// Check if we should finish
		if (chatState.questionIndex >= questionsToUse.length - 1) {
			await finishConversation();
		} else {
			await askNextQuestion();
		}
	}

	async function handleLogoRegenerate(messageId: string, feedback?: string) {
		chatState.logoStatus = 'generating';

		if (feedback) {
			await addUserMessage(feedback);
		}

		await delay(300);
		await addBotMessage("Regenerating the logo with your requested changes...");

		isTyping = true;

		try {
			const result = await fetchWithAbort<{ success: boolean; logoData?: string; logoUrl?: string; filename?: string; error?: string }>(
				'/api/generate-logo',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						brandName: collectedInfo.brandName || answers['brandName'] || '',
						industry: collectedInfo.industry || answers['industry'] || '',
						style: collectedInfo.style || answers['style'] || '',
						description: collectedInfo.description || answers['shortDescription'] || '',
						values: collectedInfo.values || answers['brandValues'] || '',
						audience: collectedInfo.audience || answers['audience'] || '',
						enhancementPrompt: feedback || 'Please improve the logo design'
					})
				}
			);

			// Handle both logoData (base64) and logoUrl response formats
			const logoData = result.logoData || result.logoUrl;
			if (!result.success || !logoData) {
				throw new Error(result.error || 'Failed to regenerate logo');
			}

			const brandName = collectedInfo.brandName || answers['brandName'] || 'brand';
			answers['logo'] = {
				type: 'ai-generated',
				fileData: logoData,
				filename: result.filename || `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`,
				status: 'pending-acceptance'
			};

			const logoMessage = await addBotMessage(
				"I've regenerated the logo. Please review and let me know if you'd like to accept or make more changes.",
				{ logoData: logoData }
			);

			chatState.logoStatus = 'pending-acceptance';
			chatState.currentLogoMessageId = logoMessage.id;

			messages = messages.map(m =>
				m.id === logoMessage.id
					? { ...m, waitingForLogoAcceptance: true, logoAccepted: false }
					: m
			);
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return;

			console.error('[Chatbot] Logo regeneration error:', error);
			chatState.logoStatus = 'pending-acceptance';
			await addBotMessage(
				`Logo regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
			);
		} finally {
			isTyping = false;
		}
	}

	// ============================================================================
	// STEP HANDLING (Progressive Generation)
	// ============================================================================

	function parseStepCommand(message: string): {
		action: 'approve' | 'change' | null;
		stepIndex: number | null;
		feedback: string | null;
		isCompleteReplacement: boolean;
	} {
		const lower = message.toLowerCase().trim();

		// Find step index
		let stepIndex: number | null = null;
		const stepMatch = lower.match(/step\s*(\d+)/i);
		if (stepMatch) {
			stepIndex = parseInt(stepMatch[1]) - 1;
		}

		// If no step specified, use most recent unapproved
		if (stepIndex === null) {
			const unapproved = messages
				.filter(m => m.type === 'step' && m.stepData && !m.stepData.isApproved && !m.stepData.isGenerating)
				.map(m => m.stepData!.stepIndex);
			stepIndex = unapproved.length > 0 ? unapproved[unapproved.length - 1] : null;
		}

		// Detect action
		const approveWords = ['approve', 'looks good', 'perfect', 'yes', 'ok', 'okay', 'accept', 'good', 'great'];
		const changeWords = ['change', 'modify', 'update', 'edit', 'fix', 'revise', 'redo', 'regenerate'];

		let action: 'approve' | 'change' | null = null;
		if (approveWords.some(w => lower.includes(w))) {
			action = 'approve';
		} else if (changeWords.some(w => lower.includes(w))) {
			action = 'change';
		}

		// Check for complete replacement
		const completeWords = ['completely', 'entirely', 'start over', 'from scratch'];
		const isCompleteReplacement = completeWords.some(w => lower.includes(w));

		return {
			action,
			stepIndex,
			feedback: action === 'change' ? message : null,
			isCompleteReplacement
		};
	}

	export async function handleStepGenerated(step: {
		stepId: string;
		stepTitle: string;
		stepDescription: string;
		content: any;
		stepIndex: number;
		isGenerating: boolean;
		isApproved: boolean;
	}) {
		const existingIndex = messages.findIndex(
			m => m.type === 'step' && m.stepData?.stepIndex === step.stepIndex
		);

		const stepMessage: ChatMessage = {
			id: `step-${step.stepIndex}-${Date.now()}`,
			type: 'step',
			content: '',
			timestamp: new Date(),
			stepData: { ...step }
		};

		if (existingIndex !== -1) {
			messages[existingIndex] = stepMessage;
			messages = [...messages];
		} else {
			messages = [...messages, stepMessage];
		}

		await scrollToBottom();
	}

	async function handleApproveStep(stepIndex: number) {
		if (!onApproveStep) return;

		// Cancel auto-approve
		if (autoApproveTimers.has(stepIndex)) {
			clearTimeout(autoApproveTimers.get(stepIndex)!);
			autoApproveTimers.delete(stepIndex);
		}

		// Check if still generating
		const stepMsg = messages.find(m => m.type === 'step' && m.stepData?.stepIndex === stepIndex);
		if (stepMsg?.stepData?.isGenerating) {
			await addBotMessage('Please wait for the step to finish generating.');
			return;
		}

		// Update message
		const msgIndex = messages.findIndex(m => m.type === 'step' && m.stepData?.stepIndex === stepIndex);
		if (msgIndex !== -1) {
			messages[msgIndex] = {
				...messages[msgIndex],
				stepData: { ...messages[msgIndex].stepData!, isApproved: true }
			};
			messages = [...messages];
		}

		const isLastStep = totalSteps ? stepIndex >= totalSteps - 1 : false;

		await delay(200);
		await addBotMessage(isLastStep
			? 'Final step approved! Would you like to save your brand guidelines now?'
			: 'Step approved! Generating next step...'
		);

		await delay(400);
		onApproveStep(stepIndex);
	}

	async function handleRegenerateStep(stepIndex: number, feedback: string, isCompleteReplacement: boolean = false) {
		if (!onRegenerateStep || !feedback.trim()) return;

		// Cancel auto-approve
		if (autoApproveTimers.has(stepIndex)) {
			clearTimeout(autoApproveTimers.get(stepIndex)!);
			autoApproveTimers.delete(stepIndex);
		}

		// Get current content for partial updates
		const stepMsg = messages.find(m => m.type === 'step' && m.stepData?.stepIndex === stepIndex);
		const currentContent = stepMsg?.stepData?.content || '';

		let enhancedFeedback = feedback;
		if (!isCompleteReplacement) {
			enhancedFeedback = `PARTIAL UPDATE: Only modify what the user requested. Keep everything else.
USER REQUEST: "${feedback}"
CURRENT CONTENT: ${typeof currentContent === 'string' ? currentContent.substring(0, 1500) : JSON.stringify(currentContent).substring(0, 1500)}`;
		}

		// Update message to show regenerating
		const msgIndex = messages.findIndex(m => m.type === 'step' && m.stepData?.stepIndex === stepIndex);
		if (msgIndex !== -1) {
			messages[msgIndex] = {
				...messages[msgIndex],
				stepData: { ...messages[msgIndex].stepData!, isGenerating: true, isApproved: false }
			};
			messages = [...messages];
		}

		onRegenerateStep(stepIndex, enhancedFeedback);

		await delay(200);
		await addBotMessage(`${isCompleteReplacement ? 'Regenerating' : 'Updating'} step with your feedback...`);
	}

	// ============================================================================
	// GENERATION
	// ============================================================================

	function handleGenerate() {
		abortController = new AbortController();
		chatState.phase = 'generating';

		const brandName = collectedInfo.brandName || answers['brandName'] || '';
		const industry = collectedInfo.industry || answers['industry'] || '';
		const style = collectedInfo.style || answers['style'] || '';

		// Build industry-specific info
		const industrySpecificInfo: Record<string, any> = {};
		industryQuestions.forEach(q => {
			if (answers[q.id]) {
				industrySpecificInfo[q.id] = answers[q.id];
			}
		});

		// Generate description if not provided
		let shortDescription = collectedInfo.description || answers['shortDescription'] || '';
		if (!shortDescription) {
			const parts = [brandName, industry ? `a ${industry} company` : '', style ? `with ${style} aesthetic` : ''];
			shortDescription = parts.filter(Boolean).join(', ') || `${brandName || 'A brand'} in the ${industry || 'business'} industry`;
		}

		// Format logo data
		let logoData = answers['logo'];
		if (logoData?.type === 'ai-generated' && logoData.fileData) {
			logoData = {
				type: 'ai-generated',
				fileData: logoData.fileData,
				filename: logoData.filename || `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`,
				status: 'generated'
			};
		}

		const formData = {
			brandName,
			brandDomain: industry,
			shortDescription,
			brandValues: collectedInfo.values || answers['brandValues'] || '',
			selectedMood: style || answers['selectedMood'] || '',
			selectedAudience: collectedInfo.audience || answers['selectedAudience'] || '',
			contactName: answers['contactName'] || '',
			contactEmail: answers['contactEmail'] || '',
			contactRole: answers['contactRole'] || '',
			contactCompany: answers['contactCompany'] || '',
			customPrompt: answers['customPrompt'] || collectedInfo.description || '',
			logoData,
			groundingData,
			industrySpecificInfo
		};

		onComplete(formData);
	}

	// ============================================================================
	// PUBLIC API
	// ============================================================================

	export function clearChatState() {
		abortOngoingRequests();
		cancelAllAutoApproves();

		messages = [];
		answers = {};
		collectedInfo = {};
		allQuestions = [];
		industryQuestions = [];
		hasFetchedIndustryQuestions = false;
		groundingData = null;
		groundingIndustry = null;
		isFetchingGroundingData = false;
		userInput = '';
		isTyping = false;
		showSuggestions = false;
		currentSuggestions = [];
		isMultiline = false;

		chatState = {
			phase: 'initial',
			questionIndex: -1,
			isEditing: false,
			editingIndex: -1,
			returnToIndex: -1,
			logoStatus: 'none',
			currentLogoMessageId: null
		};

		clearStoredState();

		tick().then(async () => {
			await delay(200);
			await addBotMessage(
				"Hi! I'm your Brand Builder Assistant. I'll help you create comprehensive brand guidelines.\n\n" +
				"**Please describe what you'd like to create.** Tell me about your brand name, industry, style preferences, or any other details."
			);
		});
	}

	// ============================================================================
	// LIFECYCLE
	// ============================================================================

	onMount(async () => {
		if (typeof window === 'undefined') return;

		// Try to restore state
		const restored = loadState();

		if (restored) {
			// Check if we need to show welcome message
			const hasUserMessages = messages.some(m => m.type === 'user');
			if (!hasUserMessages) {
				chatState.phase = 'initial';
				const hasWelcome = messages.some(m => m.type === 'bot' && m.content.includes("Brand Builder Assistant"));
				if (!hasWelcome) {
					await delay(200);
					await addBotMessage(
						"Hi! I'm your Brand Builder Assistant. I'll help you create comprehensive brand guidelines.\n\n" +
						"**Please describe what you'd like to create.** Tell me about your brand name, industry, style preferences, or any other details."
					);
				}
			}
			await scrollToBottom();
		} else {
			// Fresh start
			chatState.phase = 'initial';
			await delay(300);
			await addBotMessage(
				"Hi! I'm your Brand Builder Assistant. I'll help you create comprehensive brand guidelines.\n\n" +
				"**Please describe what you'd like to create.** Tell me about your brand name, industry, style preferences, or any other details."
			);
		}

		focusInput();
	});

	onDestroy(() => {
		abortOngoingRequests();
		cancelAllAutoApproves();
		if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
		if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
	});

	// Focus input when appropriate
	$: if (chatState.phase !== 'initial' || messages.length > 0) {
		focusInput();
	}
</script>

<Card class="flex h-full max-h-[900px] min-h-[600px] w-full max-w-[600px] flex-col overflow-hidden border-border/50 bg-card/95 shadow-xl backdrop-blur-sm">
	<CardHeader class="flex-shrink-0 border-b border-border/50 bg-gradient-to-r from-orange-500/10 to-orange-600/5 p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
					<Bot class="h-5 w-5 text-white" />
				</div>
				<div>
					<h2 class="text-lg font-semibold text-foreground">Brand Builder Assistant</h2>
					<p class="text-xs text-muted-foreground">AI-powered questionnaire</p>
				</div>
			</div>
			{#if messages.length > 1}
				<Button
					variant="ghost"
					size="sm"
					onclick={clearChatState}
					class="text-muted-foreground hover:text-foreground"
					title="Start over"
				>
					<RotateCcw class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	</CardHeader>

	<CardContent class="flex flex-1 flex-col overflow-hidden p-0">
		<!-- Messages -->
		<div
			bind:this={chatContainer}
			class="flex-1 space-y-4 overflow-y-auto scroll-smooth p-4"
		>
			{#each messages as message (message.id)}
				{#if message.type === 'step' && message.stepData}
					<!-- Step Message -->
					<div class="flex items-start gap-3">
						<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
							<Bot class="h-4 w-4 text-white" />
						</div>
						<div class="flex-1 space-y-2">
							<div class="rounded-lg border border-border/50 bg-card p-4">
								<h3 class="font-medium text-foreground">{message.stepData.stepTitle}</h3>
								<p class="text-sm text-muted-foreground">{message.stepData.stepDescription}</p>

								{#if message.stepData.isGenerating || !message.stepData.content}
									<div class="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
										<div class="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></div>
										<span>Generating...</span>
									</div>
								{:else}
									<div class="mt-3 max-h-48 overflow-y-auto text-sm text-foreground">
										{typeof message.stepData.content === 'string'
											? message.stepData.content.substring(0, 400) + (message.stepData.content.length > 400 ? '...' : '')
											: JSON.stringify(message.stepData.content, null, 2).substring(0, 400) + '...'}
									</div>

									{#if !message.stepData.isApproved}
										<div class="mt-3 flex gap-2 border-t border-border/30 pt-3">
											<Button
												onclick={() => handleApproveStep(message.stepData!.stepIndex)}
												size="sm"
												class="bg-green-600 hover:bg-green-700"
											>
												<CheckCircle class="mr-1 h-4 w-4" />
												Approve
											</Button>
										</div>
									{:else}
										<div class="mt-3 flex items-center gap-2 text-sm text-green-600">
											<CheckCircle class="h-4 w-4" />
											<span>Approved</span>
										</div>
									{/if}
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<ChatMessage
						{message}
						canEdit={message.type === 'user' && message.questionIndex !== undefined && message.questionIndex >= 0 && chatState.phase !== 'generating'}
						onEdit={() => {
							if (message.questionIndex !== undefined) {
								handleEditAnswer(message.questionIndex);
							}
						}}
						onAcceptLogo={handleLogoAccept}
						onRegenerateLogo={handleLogoRegenerate}
					/>
				{/if}
			{/each}

			{#if isFetchingGroundingData}
				<div class="ml-11 flex items-center gap-2 text-sm text-muted-foreground">
					<div class="flex gap-1">
						<span class="h-2 w-2 animate-bounce rounded-full bg-orange-500" style="animation-delay: 0ms"></span>
						<span class="h-2 w-2 animate-bounce rounded-full bg-orange-500" style="animation-delay: 150ms"></span>
						<span class="h-2 w-2 animate-bounce rounded-full bg-orange-500" style="animation-delay: 300ms"></span>
					</div>
					<span>Researching {collectedInfo.industry || 'industry'} brands...</span>
				</div>
			{/if}

			{#if isTyping}
				<TypingIndicator />
			{/if}
		</div>

		<!-- Input Area -->
		<div class="flex-shrink-0 space-y-3 border-t border-border/50 bg-muted/30 p-4">
			<!-- Suggestion Chips - shown above input for better visibility -->
			{#if showSuggestions && currentSuggestions.length > 0 && chatState.phase === 'questioning'}
				<div class="max-h-32 overflow-y-auto">
					<SuggestionChips suggestions={currentSuggestions} onSelect={handleSuggestionClick} />
				</div>
			{/if}

			{#if chatState.isEditing && chatState.editingIndex >= 0}
				{@const editQuestion = questionsToUse[chatState.editingIndex]}
				{#if editQuestion}
					<div class="flex items-center gap-2 rounded-lg bg-orange-500/10 p-2 text-sm">
						<Edit2 class="h-4 w-4 text-orange-500" />
						<span>Editing: <strong>{editQuestion.question}</strong></span>
					</div>
				{/if}
			{/if}

			<!-- Logo buttons -->
			{#if isLogoQuestion && chatState.phase === 'questioning' && chatState.logoStatus !== 'pending-acceptance'}
				<div class="grid grid-cols-2 gap-2">
					<Button
						onclick={triggerFileUpload}
						variant="outline"
						class="border-orange-500/30 hover:bg-orange-500/10"
						disabled={chatState.logoStatus === 'uploading' || chatState.logoStatus === 'generating'}
					>
						<Upload class="mr-2 h-4 w-4" />
						Upload Logo
					</Button>
					<Button
						onclick={handleGenerateLogo}
						variant="outline"
						class="border-orange-500/30 hover:bg-orange-500/10"
						disabled={chatState.logoStatus === 'uploading' || chatState.logoStatus === 'generating'}
					>
						<Sparkles class="mr-2 h-4 w-4" />
						Generate with AI
					</Button>
				</div>
				<input
					bind:this={fileInput}
					type="file"
					class="hidden"
					accept="image/*"
					onchange={handleLogoUpload}
				/>
			{/if}

			<!-- Text input -->
			<div class="flex items-end gap-2">
				{#if isMultiline && !chatState.isEditing}
					<Textarea
						bind:ref={inputElement}
						bind:value={userInput}
						placeholder={chatState.phase === 'complete' ? 'Add more details or start a new brand...' : 'Type your answer...'}
						rows={3}
						class="flex-1 resize-none"
						onkeydown={handleKeyPress}
					/>
				{:else}
					<Input
						bind:ref={inputElement}
						bind:value={userInput}
						placeholder={
							chatState.phase === 'initial' ? "Describe your brand (e.g., 'TechFlow, a modern SaaS company')..." :
							chatState.phase === 'generating' ? "Type to approve or request changes..." :
							chatState.phase === 'complete' ? "Add more details or start a new brand..." :
							chatState.logoStatus === 'pending-acceptance' ? "Type feedback for logo changes..." :
							"Type your answer..."
						}
						class="flex-1"
						onkeydown={handleKeyPress}
					/>
				{/if}

				<Button
					onclick={handleSubmit}
					disabled={!userInput.trim() && chatState.phase !== 'initial' && currentQuestion?.required}
					class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
				>
					{#if chatState.isEditing}
						<Edit2 class="h-5 w-5" />
					{:else}
						<Send class="h-5 w-5" />
					{/if}
				</Button>

				{#if chatState.isEditing}
					<Button variant="ghost" onclick={cancelEditing}>
						Cancel
					</Button>
				{:else if chatState.phase === 'questioning' && isCurrentQuestionOptional && !isLogoQuestion}
					<Button variant="ghost" onclick={handleSkip}>
						Skip
					</Button>
				{/if}
			</div>

			<div class="text-xs text-muted-foreground">
				<kbd class="rounded border bg-muted px-1">Enter</kbd> to send
				<span class="mx-1">·</span>
				<kbd class="rounded border bg-muted px-1">Shift</kbd>+<kbd class="rounded border bg-muted px-1">Enter</kbd> for new line
			</div>

			<!-- Generate button -->
			{#if chatState.phase === 'complete' && !chatState.isEditing && !userInput.trim()}
				<Button
					onclick={handleGenerate}
					disabled={!effectiveCanGenerate}
					class="w-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg hover:from-orange-600 hover:to-orange-700"
					size="lg"
				>
					<Sparkles class="mr-2 h-5 w-5" />
					Generate Brand Guidelines
				</Button>
			{/if}
		</div>
	</CardContent>
</Card>
