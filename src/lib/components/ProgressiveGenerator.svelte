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
	import { GENERATION_STEPS, type GenerationStep } from '$lib/utils/progressive-generation';
	import { getDomainSpecificStepInfo } from '$lib/utils/domain-specific-steps';

	export let brandInput: BrandGuidelinesInput;
	export let logoFiles: Array<{ filename: string; fileData: string; usageTag: string }> = [];
	export let onComplete: (guidelines: any) => void;

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

	// Available step definitions (without final-review)
	let stepDefinitions = [
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
		},
		{
			id: 'photography',
			defaultTitle: 'Photography',
			defaultDescription: 'Photo style guidelines'
		},
		{
			id: 'applications',
			defaultTitle: 'Applications',
			defaultDescription: 'Brand applications'
		}
	];

	// Store AI-generated titles
	let aiGeneratedTitles: Array<{ id: string; title: string; description: string }> = [];

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
				// Filter out final-review from AI generated titles
				aiGeneratedTitles = generatedSteps.filter((s: any) => s.id !== 'final-review');
			}
		} catch (error) {
			console.error('Failed to generate step titles:', error);
		}
	}

	// Generate step titles when component mounts or input changes
	$: if (brandInput.brand_name && brandInput.brand_domain && !hasStarted) {
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
		hasStarted = true;
		generatedSteps = [];
		await generateNextStep();
	}

	async function generateNextStep() {
		// Check if all steps are generated
		if (generatedSteps.length >= stepDefinitions.length) {
			// All steps complete - trigger completion
			await completeGeneration();
			return;
		}

		isGeneratingNewStep = true;
		const nextStepDef = stepDefinitions[generatedSteps.length];
		const stepInfo = getStepInfo(nextStepDef.id);

		// Add a placeholder for the new step
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

		try {
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
							file_size: 0
						}))
					},
					userApproval: false
				})
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
			} else {
				throw new Error(result.error || 'Failed to generate step');
			}
		} catch (error) {
			console.error('Error generating step:', error);
			// Remove the failed step
			generatedSteps = generatedSteps.slice(0, -1);
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
		
		// Just generate the next step if there are more
		if (generatedSteps.length < stepDefinitions.length) {
			await generateNextStep();
		} else {
			// All steps generated, complete the process
			await completeGeneration();
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
							file_size: 0
						}))
					},
					userApproval: false,
					feedback: feedback
				})
			});

			const result = await response.json();

			if (result.success) {
				// Update the step with new content (keep previous content for revert)
				generatedSteps = generatedSteps.map((s, idx) =>
					idx === stepIndex ? { ...s, content: result.content, isGenerating: false } : s
				);
			} else {
				throw new Error(result.error || 'Failed to regenerate step');
			}
		} catch (error) {
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
			console.log('API Response result:', result);

			if (result.success && result.brandGuidelines) {
				console.log('Generation completed successfully, calling onComplete');
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

<div class="progressive-generator">
	<!-- Progress Header -->
	<div class="progress-header">
		<div class="progress-info">
			<h2 class="text-2xl font-bold text-foreground">Progressive Brand Guidelines Generation</h2>
			<p class="text-muted-foreground">
				Steps will appear one by one. Review and approve each to continue, or edit any step anytime.
			</p>
		</div>

		{#if hasStarted}
			<div class="progress-bar">
				<div class="progress-track">
					<div 
						class="progress-fill" 
						style="width: {getProgressPercentage()}%; transition: width 0.5s ease-in-out;"
					></div>
				</div>
				<span class="progress-text">
					{generatedSteps.filter(s => !s.isGenerating).length} of {stepDefinitions.length} steps complete ({getProgressPercentage()}%)
				</span>
			</div>
		{/if}
	</div>

	{#if !hasStarted}
		<!-- Start Button -->
		<Card>
			<CardContent class="p-8 text-center">
				<div class="start-generation">
					<p class="mb-4 text-muted-foreground">
						Ready to start generating your brand guidelines step by step?
					</p>
					<Button onclick={startProgressiveGeneration} class="start-btn">
						<ArrowRight class="mr-2 h-4 w-4" />
						Start Progressive Generation
					</Button>
				</div>
			</CardContent>
		</Card>
	{:else}
		<!-- Generated Steps Stack -->
		<div class="generated-steps-stack">
			{#each generatedSteps as step, index}
				<div class="step-container" id="step-{index}">
					{#if step.content || step.isGenerating}
						<StepSlide
							stepData={step.content}
							stepTitle={step.stepTitle}
							stepDescription={step.stepDescription}
							stepId={step.stepId}
							isGenerating={step.isGenerating}
							onApprove={() => approveStep(index)}
							onRegenerate={(feedback) => regenerateStep(index, feedback)}
							onRevert={() => revertStep(index)}
							{logoFiles}
							stepIndex={index}
							isLastStep={index === generatedSteps.length - 1 && !step.isGenerating}
							isApproved={step.isApproved}
							canRevert={step.hasBeenEdited && step.previousContent !== null}
							showApproveButton={index === generatedSteps.length - 1 &&
								!step.isGenerating &&
								!step.isApproved &&
								generatedSteps.length < stepDefinitions.length}
						/>
					{/if}
				</div>
			{/each}

			<!-- Show completion button when all steps are done -->
			{#if generatedSteps.length === stepDefinitions.length && !isGeneratingNewStep}
				<div class="completion-section">
					<Card>
						<CardContent class="p-8 text-center">
							<CheckCircle class="mx-auto mb-4 h-16 w-16 text-primary" />
							<h3 class="mb-2 text-xl font-semibold text-foreground">
								All Steps Complete!
							</h3>
							<p class="mb-6 text-muted-foreground">
								Review your brand guidelines above. You can edit any step before saving.
							</p>
							<Button onclick={completeGeneration} class="complete-btn" size="lg">
								<CheckCircle class="mr-2 h-5 w-5" />
								Save Brand Guidelines
							</Button>
						</CardContent>
					</Card>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.progressive-generator {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.progress-header {
		margin-bottom: 2rem;
	}

	.progress-info {
		margin-bottom: 1rem;
	}

	.progress-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.progress-track {
		flex: 1;
		height: 8px;
		background: oklch(var(--muted));
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, oklch(var(--primary)), oklch(var(--primary) / 0.8));
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.875rem;
		font-weight: 600;
		color: oklch(var(--muted-foreground));
		min-width: 10rem;
	}

	.generated-steps-stack {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.step-container {
		animation: slideIn 0.4s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.completion-section {
		margin-top: 2rem;
		animation: fadeIn 0.5s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.complete-btn {
		background: oklch(var(--primary));
		border-color: oklch(var(--primary));
		padding: 0.75rem 2rem;
	}

	.complete-btn:hover {
		background: oklch(var(--primary) / 0.9);
		border-color: oklch(var(--primary) / 0.9);
	}

	.start-generation {
		text-align: center;
		padding: 2rem;
	}

	.start-btn {
		background: oklch(var(--primary));
		border-color: oklch(var(--primary));
		padding: 0.75rem 2rem;
	}

	.start-btn:hover {
		background: oklch(var(--primary) / 0.9);
		border-color: oklch(var(--primary) / 0.9);
	}

	@media (max-width: 768px) {
		.progressive-generator {
			padding: 1rem;
		}

		.progress-text {
			font-size: 0.75rem;
			min-width: 8rem;
		}
	}
</style>
