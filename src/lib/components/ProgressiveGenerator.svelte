<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import StepSlide from '$lib/components/StepSlide.svelte';
	import {
		CheckCircle,
		XCircle,
		Loader2,
		ArrowRight,
		RefreshCw,
		ThumbsUp,
		ThumbsDown
	} from 'lucide-svelte';
	import type { BrandGuidelinesInput } from '$lib/types/brand-guidelines';
	import { COMMON_GENERATION_STEPS, getAllStepsForIndustry, type GenerationStep } from '$lib/utils/progressive-generation';
	import { getDomainSpecificStepInfo } from '$lib/utils/domain-specific-steps';

	export let brandInput: BrandGuidelinesInput;
	export let logoFiles: Array<{ filename: string; fileData: string; usageTag: string }> = [];
	export let onComplete: (guidelines: any) => void;
	export let chatbotControlled: boolean = false; // If true, chatbot handles approval
	export let onStepGenerated: ((step: any) => void) | null = null; // Callback when step is generated

	// Progressive generation state - store all generated steps
	interface GeneratedStep {
		stepId: string;
		stepTitle: string;
		stepDescription: string;
		content: any;
		isGenerating: boolean;
		isApproved: boolean;
		previousContent: any | null;
		hasBeenEdited: boolean;
	}
	
	let generatedSteps: GeneratedStep[] = [];
	let isGeneratingNewStep = false;
	let hasStarted = false;
	let generationAbortController: AbortController | null = null; // For aborting fetch requests
	
	// Navigation state - which step is currently visible
	let currentStepIndex = 0;

	// Common step definitions (always shown)
	const commonStepDefinitions = [
		{
			id: 'brand-positioning',
			defaultTitle: 'Brand Positioning',
			defaultDescription: 'Define your brand identity'
		},
		{
			id: 'logo-guidelines',
			defaultTitle: 'Logo Guidelines',
			defaultDescription: 'Logo usage and specifications'
		},
		{
			id: 'color-palette',
			defaultTitle: 'Color Palette',
			defaultDescription: 'Brand color system'
		},
		{
			id: 'typography',
			defaultTitle: 'Typography',
			defaultDescription: 'Font selection and usage'
		},
		{
			id: 'iconography',
			defaultTitle: 'Iconography',
			defaultDescription: 'Icon style and examples'
		}
	];

	// Dynamic step definitions (industry-specific, loaded dynamically)
	let stepDefinitions = [...commonStepDefinitions];

	// Store AI-generated titles
	let aiGeneratedTitles: Array<{ id: string; title: string; description: string }> = [];

	// Load industry-specific steps dynamically
	async function loadIndustrySteps() {
		if (!brandInput.brand_domain) {
			// No industry specified, use only common steps
			stepDefinitions = [...commonStepDefinitions];
			return;
		}

		try {
			// Get industry-specific steps from the utility function
			const industry = brandInput.brand_domain;
			const industrySpecificInfo = brandInput.industrySpecificInfo || {};
			const groundingData = (brandInput as any).groundingData; // Get grounding data from brandInput
			const allStepIds = await getAllStepsForIndustry(
				industry, 
				Object.keys(industrySpecificInfo).length > 0 ? industrySpecificInfo : undefined,
				undefined, // fetchFn
				groundingData // Pass grounding data
			);
			
			// Build step definitions from step IDs
			// Common steps first
			const newStepDefinitions = [...commonStepDefinitions];
			
			// Add industry-specific steps
			const industryStepIds = allStepIds.slice(commonStepDefinitions.length);
			for (const stepId of industryStepIds) {
				// Generate default title/description for industry-specific steps
				const stepName = stepId.split('-').map(word => 
					word.charAt(0).toUpperCase() + word.slice(1)
				).join(' ');
				newStepDefinitions.push({
					id: stepId,
					defaultTitle: stepName,
					defaultDescription: `Industry-specific guidelines for ${stepName.toLowerCase()}`
				});
			}
			
			stepDefinitions = newStepDefinitions;
			console.log('Loaded industry-specific steps:', {
				industry,
				totalSteps: stepDefinitions.length,
				commonSteps: commonStepDefinitions.length,
				industrySteps: industryStepIds.length,
				stepIds: allStepIds
			});
		} catch (error) {
			console.error('Failed to load industry-specific steps:', error);
			// Fallback to common steps only
			stepDefinitions = [...commonStepDefinitions];
		}
	}

	// Function to generate dynamic step titles via AI
	async function generateStepTitles() {
		try {
			const response = await fetch('/api/generate-step-titles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					brand_domain: brandInput.brand_domain,
					brand_name: brandInput.brand_name,
					short_description: brandInput.short_description,
					selectedMood: brandInput.selectedMood,
					selectedAudience: brandInput.selectedAudience
				})
			});

			if (response.ok) {
				const generatedSteps = await response.json();
				aiGeneratedTitles = generatedSteps;
			}
		} catch (error) {
			console.error('Failed to generate step titles:', error);
		}
	}

	// Track if steps are loaded
	let stepsLoaded = false;
	let isLoadingSteps = false;

	// Load industry steps and generate titles when component mounts or input changes
	$: if (brandInput.brand_name && brandInput.brand_domain && !hasStarted && !isLoadingSteps) {
		isLoadingSteps = true;
		loadIndustrySteps().then(() => {
			stepsLoaded = true;
			isLoadingSteps = false;
		});
		generateStepTitles();
	}

	// Get step info (AI-generated or default)
	function getStepInfo(stepId: string) {
		const aiTitle = aiGeneratedTitles.find((s) => s.id === stepId);
		const defaultInfo = stepDefinitions.find((s) => s.id === stepId);
		
		return {
			title: aiTitle?.title || defaultInfo?.defaultTitle || 'Generating...',
			description: aiTitle?.description || defaultInfo?.defaultDescription || 'Please wait...'
		};
	}

	async function startProgressiveGeneration() {
		// Reset stop state
		generationAbortController = new AbortController();
		
		// Ensure steps are loaded before starting generation
		if (!stepsLoaded && brandInput.brand_domain) {
			console.log('[ProgressiveGenerator] Waiting for industry steps to load...');
			await loadIndustrySteps();
			stepsLoaded = true;
		}
		
		// Validate stepDefinitions before starting
		if (stepDefinitions.length === 0) {
			console.error('[ProgressiveGenerator] No step definitions available!');
			alert('Failed to load step definitions. Please refresh and try again.');
			return;
		}
		
		console.log('[ProgressiveGenerator] Starting generation with steps:', stepDefinitions.map(s => s.id));
		
		hasStarted = true;
		generatedSteps = [];
		currentStepIndex = 0;
		await generateNextStep();
	}
	
	// Export function for external calls
	export { startProgressiveGeneration, approveStep, regenerateStep };
	
	// Navigation functions
	function nextStepNavigation() {
		if (currentStepIndex < generatedSteps.length - 1) {
			currentStepIndex++;
		}
	}
	
	function prevStepNavigation() {
		if (currentStepIndex > 0) {
			currentStepIndex--;
		}
	}

	async function generateNextStep() {
		// Ensure steps are loaded before generating
		if (!stepsLoaded && brandInput.brand_domain) {
			console.log('[ProgressiveGenerator] Steps not loaded yet, loading now...');
			await loadIndustrySteps();
			stepsLoaded = true;
		}
		
		// Check if all steps are generated
		if (generatedSteps.length >= stepDefinitions.length) {
			// All steps complete - trigger completion
			await completeGeneration();
			return;
		}

		// Validate we have a valid step definition
		if (generatedSteps.length >= stepDefinitions.length) {
			console.error('[ProgressiveGenerator] No more steps to generate!');
			await completeGeneration();
			return;
		}

		isGeneratingNewStep = true;
		const nextStepDef = stepDefinitions[generatedSteps.length];
		
		// Validate step definition exists
		if (!nextStepDef || !nextStepDef.id) {
			console.error('[ProgressiveGenerator] Invalid step definition at index:', generatedSteps.length);
			console.error('[ProgressiveGenerator] Available stepDefinitions:', stepDefinitions);
			throw new Error(`Invalid step definition at index ${generatedSteps.length}`);
		}
		
		const stepInfo = getStepInfo(nextStepDef.id);
		
		console.log('[ProgressiveGenerator] Generating step:', {
			stepId: nextStepDef.id,
			stepIndex: generatedSteps.length,
			totalSteps: stepDefinitions.length,
			allStepIds: stepDefinitions.map(s => s.id)
		});

		// Add a placeholder for the new step
		const newStepIndex = generatedSteps.length;
		generatedSteps = [
			...generatedSteps,
			{
				stepId: nextStepDef.id,
				stepTitle: stepInfo.title,
				stepDescription: stepInfo.description,
				content: null,
				isGenerating: true,
				isApproved: false,
				previousContent: null,
				hasBeenEdited: false
			}
		];
		
		// Focus the generator view on the newly created step
		currentStepIndex = newStepIndex;
		
		// Notify chatbot if in chatbot-controlled mode (show generating state)
		if (chatbotControlled && onStepGenerated) {
			onStepGenerated({
				stepId: nextStepDef.id,
				stepTitle: stepInfo.title,
				stepDescription: stepInfo.description,
				content: null,
				stepIndex: newStepIndex,
				isGenerating: true,
				isApproved: false
			});
		}

		
		try {
			generationAbortController = new AbortController();
			const response = await fetch('/api/brand-guidelines/progressive', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					step: nextStepDef.id,
					previousSteps: {
						...brandInput,
						// Ensure all fields are included
						selectedMood: brandInput.selectedMood,
						selectedAudience: brandInput.selectedAudience,
						brandValues: brandInput.brandValues,
						customPrompt: brandInput.customPrompt,
						logo_files: logoFiles.map((logo) => ({
							filename: logo.filename,
							usage_tag: logo.usageTag,
							fileData: logo.fileData,
							file_size: 0,
							extractedColors: (logo as any).extractedColors || undefined // Include extracted colors from uploaded logo
						}))
					},
					userApproval: false
				}),
				signal: generationAbortController.signal
			});
			

			const result = await response.json();

			console.log('API Response received:', {
				step: nextStepDef.id,
				success: result.success,
				hasContent: !!result.content,
				contentType: typeof result.content,
				contentPreview: typeof result.content === 'string' ? result.content.substring(0, 200) : result.content,
				contentLength: typeof result.content === 'string' ? result.content.length : 'N/A',
				message: result.message
			});

			if (result.success) {
				// Update the step with generated content
				generatedSteps = generatedSteps.map((step, idx) =>
					idx === generatedSteps.length - 1
						? { ...step, content: result.content, isGenerating: false, isApproved: false, previousContent: null, hasBeenEdited: false }
						: step
				);
				
				console.log('Updated generatedSteps for step:', nextStepDef.id, {
					stepIndex: generatedSteps.length - 1,
					hasContent: !!generatedSteps[generatedSteps.length - 1]?.content,
					contentType: typeof generatedSteps[generatedSteps.length - 1]?.content
				});
				
				// Notify chatbot if in chatbot-controlled mode
				if (chatbotControlled && onStepGenerated) {
					const newStep = generatedSteps[generatedSteps.length - 1];
					onStepGenerated({
						stepId: newStep.stepId,
						stepTitle: newStep.stepTitle,
						stepDescription: newStep.stepDescription,
						content: newStep.content,
						stepIndex: generatedSteps.length - 1,
						isGenerating: false,
						isApproved: false
					});
				}
			} else {
				// Check if error is due to invalid step - reload steps and retry
				if (result.error && result.error.includes('Invalid generation step')) {
					console.warn('[ProgressiveGenerator] Step mismatch detected, reloading steps...');
					// Remove the invalid step placeholder
					generatedSteps = generatedSteps.slice(0, -1);
					
					// Reload steps from server
					stepsLoaded = false;
					await loadIndustrySteps();
					stepsLoaded = true;
					
					// Check if we still have steps to generate
					if (generatedSteps.length >= stepDefinitions.length) {
						// No more steps
						await completeGeneration();
						return;
					}
					
					// Get the correct step for this index
					const correctStepDef = stepDefinitions[generatedSteps.length];
					if (correctStepDef && correctStepDef.id !== nextStepDef.id) {
						// Different step - retry with correct step
						console.log('[ProgressiveGenerator] Step corrected after reload, retrying:', {
							old: nextStepDef.id,
							new: correctStepDef.id
						});
						// Retry with correct step (this will create a new step with the correct ID)
						return await generateNextStep();
					} else if (!correctStepDef) {
						// No more steps
						await completeGeneration();
						return;
					} else {
						// Same step ID but server rejected it - this is unexpected
						throw new Error(`Step ${nextStepDef.id} is invalid according to server. Please refresh and try again.`);
					}
				}
				throw new Error(result.error || 'Failed to generate step');
			}
		} catch (error) {
			// Check if error is due to abort (stop requested)
			if (error instanceof Error && error.name === 'AbortError') {
				console.log('[ProgressiveGenerator] Step generation aborted by user');
				// Remove the step that was being generated
				generatedSteps = generatedSteps.slice(0, -1);
				isGeneratingNewStep = false;
				return;
			}
			
			console.error('Error generating step:', error);
			// Remove the failed step
			generatedSteps = generatedSteps.slice(0, -1);
			
			// If it's an invalid step error, try to recover
			if (error instanceof Error && error.message.includes('Invalid generation step')) {
				console.warn('[ProgressiveGenerator] Attempting to recover from invalid step error...');
				// Reload steps and try again
				stepsLoaded = false;
				try {
					await loadIndustrySteps();
					stepsLoaded = true;
					// Retry generation
					await generateNextStep();
					return;
				} catch (reloadError) {
					console.error('[ProgressiveGenerator] Failed to reload steps:', reloadError);
				}
			}
			
			alert('Failed to generate this step. Please try again.');
		} finally {
			isGeneratingNewStep = false;
		}
	}

	// Approve a step and generate the next one
	async function approveStep(stepIndex: number) {
		// Mark the step as approved
		generatedSteps = generatedSteps.map((s, idx) =>
			idx === stepIndex ? { ...s, isApproved: true } : s
		);
		
		// Notify chatbot about approval update
		if (chatbotControlled && onStepGenerated && generatedSteps[stepIndex]) {
			const approvedStep = generatedSteps[stepIndex];
			onStepGenerated({
				stepId: approvedStep.stepId,
				stepTitle: approvedStep.stepTitle,
				stepDescription: approvedStep.stepDescription,
				content: approvedStep.content,
				stepIndex: stepIndex,
				isGenerating: approvedStep.isGenerating,
				isApproved: true
			});
		}
		
		// Generate next step if there are more
		if (generatedSteps.length < stepDefinitions.length) {
			await generateNextStep();
			// Advance to the newly generated step
			currentStepIndex = generatedSteps.length - 1;
		} else {
			// All steps generated, advance to next (or complete)
			if (currentStepIndex < generatedSteps.length - 1) {
				currentStepIndex++;
			}
		}
	}

	// Regenerate a specific step with feedback
	async function regenerateStep(stepIndex: number, feedback: string) {
		const step = generatedSteps[stepIndex];
		if (!step) return;

		// Save current content as previous before regenerating
		const currentContent = step.content;

		// Mark step as generating
		generatedSteps = generatedSteps.map((s, idx) =>
			idx === stepIndex ? { ...s, isGenerating: true, previousContent: currentContent, hasBeenEdited: true } : s
		);

		
		try {
			generationAbortController = new AbortController();
			
			// Build stepHistory from generatedSteps for context
			const stepHistory = generatedSteps
				.filter(s => s.content && !s.isGenerating)
				.map(s => ({
					step: s.stepId,
					content: s.content,
					approved: s.isApproved,
					title: s.stepTitle
				}));
			
			const response = await fetch('/api/brand-guidelines/progressive', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					step: step.stepId,
					previousSteps: {
						...brandInput,
						// Ensure all fields are included
						selectedMood: brandInput.selectedMood,
						selectedAudience: brandInput.selectedAudience,
						brandValues: brandInput.brandValues,
						customPrompt: brandInput.customPrompt,
						logo_files: logoFiles.map((logo) => ({
							filename: logo.filename,
							usage_tag: logo.usageTag,
							fileData: logo.fileData,
							file_size: 0,
							extractedColors: (logo as any).extractedColors || undefined // Include extracted colors from uploaded logo
						})),
						// Include stepHistory so the API can access current step content for partial modifications
						stepHistory: stepHistory
					},
					userApproval: false,
					feedback: feedback,
					stepHistory: stepHistory // Also pass directly for API compatibility
				}),
				signal: generationAbortController.signal
			});
			

			const result = await response.json();

			if (result.success) {
				// Update the step with new content (keep previous content for revert)
				generatedSteps = generatedSteps.map((s, idx) =>
					idx === stepIndex ? { ...s, content: result.content, isGenerating: false } : s
				);
				
				// Notify chatbot if in chatbot-controlled mode
				if (chatbotControlled && onStepGenerated) {
					const updatedStep = generatedSteps[stepIndex];
					onStepGenerated({
						stepId: updatedStep.stepId,
						stepTitle: updatedStep.stepTitle,
						stepDescription: updatedStep.stepDescription,
						content: updatedStep.content,
						stepIndex: stepIndex,
						isGenerating: false,
						isApproved: updatedStep.isApproved
					});
				}
			} else {
				throw new Error(result.error || 'Failed to regenerate step');
			}
		} catch (error) {
			// Check if error is due to abort (stop requested)
			if (error instanceof Error && error.name === 'AbortError') {
				console.log('[ProgressiveGenerator] Step regeneration aborted by user');
				generatedSteps = generatedSteps.map((s, idx) =>
					idx === stepIndex ? { ...s, isGenerating: false } : s
				);
				return;
			}
			
			console.error('Error regenerating step:', error);
			alert('Failed to regenerate this step. Please try again.');
			// Reset generating state and restore previous content
			generatedSteps = generatedSteps.map((s, idx) =>
				idx === stepIndex ? { ...s, isGenerating: false, previousContent: null } : s
			);
		}
	}

	// Revert a step to its previous content
	function revertStep(stepIndex: number) {
		const step = generatedSteps[stepIndex];
		if (!step || !step.previousContent) return;

		// Restore previous content
		generatedSteps = generatedSteps.map((s, idx) =>
			idx === stepIndex
				? { ...s, content: s.previousContent, previousContent: null, hasBeenEdited: false }
				: s
		);
	}

	async function completeGeneration() {
		try {
			console.log('Starting completeGeneration with generatedSteps:', generatedSteps);

			// Build step history from generated steps
			const cleanStepHistory = generatedSteps.map((step) => {
				// Keep content as-is (should be a string from the AI)
				console.log('Processing step for save:', {
					stepId: step.stepId,
					stepTitle: step.stepTitle,
					contentType: typeof step.content,
					contentPreview: typeof step.content === 'string' ? step.content.substring(0, 100) : step.content
				});

				return {
					step: step.stepId,
					title: step.stepTitle,  // Save AI-generated title!
					description: step.stepDescription,  // Save AI-generated description!
					content: step.content, // Keep raw content (string from AI)
					approved: true
				};
			});
			
			console.log('Clean step history for saving:', {
				stepCount: cleanStepHistory.length,
				steps: cleanStepHistory.map((s: any) => ({
					step: s.step,
					title: s.title,
					contentType: typeof s.content,
					contentLength: typeof s.content === 'string' ? s.content.length : 'N/A'
				}))
			});

			// Save to database via the comprehensive endpoint
			const payload = {
				...brandInput,
				logo_files: logoFiles.map((logo) => ({
					filename: logo.filename,
					usage_tag: logo.usageTag,
					fileData: logo.fileData,
					file_size: 0
				})),
				stepHistory: cleanStepHistory
			};
			
			console.log('Payload being sent to comprehensive API:', {
				brand_name: payload.brand_name,
				hasStepHistory: !!payload.stepHistory,
				stepHistoryCount: payload.stepHistory?.length || 0,
				logoFilesCount: payload.logo_files?.length || 0
			});

			const response = await fetch('/api/brand-guidelines/comprehensive', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('API Error Response:', errorText);
				throw new Error(`API Error: ${response.status} - ${errorText}`);
			}

			const result = await response.json();
			console.log('[ProgressiveGenerator] API Response result:', {
				success: result.success,
				hasBrandGuidelines: !!result.brandGuidelines,
				hasSavedGuidelines: !!result.savedGuidelines,
				guidelineId: result.savedGuidelines?.id,
				savedGuidelines: result.savedGuidelines
			});

			if (result.success && result.brandGuidelines) {
				if (!result.savedGuidelines?.id) {
					console.error('[ProgressiveGenerator] ⚠️ WARNING: savedGuidelines missing or has no ID!', {
						savedGuidelines: result.savedGuidelines
					});
				}
				console.log('[ProgressiveGenerator] Generation completed successfully, calling onComplete with guidelineId:', result.savedGuidelines?.id);
				onComplete({
					stepHistory: cleanStepHistory,
					brandInput: brandInput,
					logoFiles: logoFiles,
					completeGuidelines: result.brandGuidelines,
					savedGuidelines: result.savedGuidelines // Pass the saved DB record with ID
				});
			} else {
				throw new Error(
					result.error || 'Failed to complete generation - no brandGuidelines returned'
				);
			}
		} catch (error) {
			console.error('Error completing generation:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			alert(`Failed to complete generation: ${errorMessage}`);
		}
	}

	function getProgressPercentage(): number {
		if (!hasStarted) return 0;
		// Count fully generated steps (not currently generating)
		const completedSteps = generatedSteps.filter(s => !s.isGenerating).length;
		return Math.round((completedSteps / stepDefinitions.length) * 100);
	}
	
	// Reactive statement to log progress
	$: if (hasStarted) {
		console.log('Progress update:', {
			completedSteps: generatedSteps.filter(s => !s.isGenerating).length,
			totalSteps: stepDefinitions.length,
			percentage: getProgressPercentage()
		});
	}
</script>

<div class="progressive-generator h-full">
	{#if !hasStarted}
		<!-- Start Button -->
		<Card class="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm h-full w-[580px] flex flex-col">
			<CardContent class="p-8 text-center flex-1 flex flex-col justify-center">
				<div class="start-generation">
					<h2 class="text-2xl font-bold text-foreground mb-3">Progressive Brand Guidelines Generation</h2>
					<p class="text-muted-foreground mb-6">
						Steps will appear one by one. Review and approve each to continue, or edit any step anytime.
					</p>
					<div class="mb-6 inline-flex p-4 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10">
						<ArrowRight class="h-12 w-12 text-orange-500" />
					</div>
					<p class="mb-6 text-base text-muted-foreground">
						Ready to start generating your brand guidelines step by step?
					</p>
					<Button 
						onclick={startProgressiveGeneration} 
						class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30"
						size="lg"
					>
						<ArrowRight class="mr-2 h-5 w-5" />
						Start Progressive Generation
					</Button>
				</div>
			</CardContent>
		</Card>
	{:else}
		<!-- Single Step Display -->
		{#if generatedSteps[currentStepIndex]}
			{@const step = generatedSteps[currentStepIndex]}
			<div class="single-step-view">
				{#if step.content || step.isGenerating}
					<StepSlide
						stepData={step.content}
						stepTitle={step.stepTitle}
						stepDescription={step.stepDescription}
						stepId={step.stepId}
						isGenerating={step.isGenerating}
						onApprove={() => approveStep(currentStepIndex)}
						onRegenerate={(feedback) => regenerateStep(currentStepIndex, feedback)}
						onRevert={() => revertStep(currentStepIndex)}
						{logoFiles}
						stepIndex={currentStepIndex}
						isLastStep={currentStepIndex === stepDefinitions.length - 1}
						isApproved={step.isApproved}
						canRevert={step.hasBeenEdited && step.previousContent !== null}
						showApproveButton={!step.isGenerating && !step.isApproved && !chatbotControlled}
						readOnly={chatbotControlled}
						showNavigationButtons={true}
						onPrevious={prevStepNavigation}
						onNext={nextStepNavigation}
						canGoNext={step.isApproved && currentStepIndex < generatedSteps.length - 1}
						canGoPrevious={currentStepIndex > 0}
						showCompleteButton={currentStepIndex === stepDefinitions.length - 1 && generatedSteps.length === stepDefinitions.length && step.isApproved}
						onComplete={completeGeneration}
						showProgressIndicator={true}
						currentStep={currentStepIndex + 1}
						totalSteps={stepDefinitions.length}
						progressPercentage={Math.round(((currentStepIndex + 1) / stepDefinitions.length) * 100)}
						allSteps={stepDefinitions.map((stepDef, idx) => ({
							...getStepInfo(stepDef.id),
							isApproved: generatedSteps[idx]?.isApproved || false,
							isCurrent: idx === currentStepIndex
						}))}
					/>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.progressive-generator {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
	}

	.start-generation {
		text-align: center;
		padding: 2rem;
	}

	@media (max-width: 768px) {
		.progressive-generator {
			padding: 1rem;
		}
	}
</style>
