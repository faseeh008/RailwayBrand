<script lang="ts">
	import StepSlide from '$lib/components/StepSlide.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';

	export let structuredData: any;
	export let logoFiles: Array<{ filename: string; filePath: string; usageTag: string }> = [];

	// Parse structured data to extract steps
	let steps: Array<{
		stepId: string;
		stepTitle: string;
		stepDescription: string;
		content: any;
	}> = [];

	$: if (structuredData) {
		try {
			const data = typeof structuredData === 'string' ? JSON.parse(structuredData) : structuredData;
			
			console.log('StepViewer - Parsed structured data:', data);
			
			// Check if we have stepHistory (raw AI-generated content)
			if (data.stepHistory && Array.isArray(data.stepHistory)) {
				console.log('Using stepHistory for display:', data.stepHistory);
				
				// Map step IDs to friendly titles
				const stepTitleMap: Record<string, { title: string; description: string }> = {
					'brand-positioning': { title: 'Brand Positioning', description: 'Brand identity and positioning' },
					'logo-guidelines': { title: 'Logo Guidelines', description: 'Logo usage and specifications' },
					'color-palette': { title: 'Color Palette', description: 'Brand color system' },
					'typography': { title: 'Typography', description: 'Font selection and usage' },
					'iconography': { title: 'Iconography', description: 'Icon style and examples' },
					'photography': { title: 'Photography', description: 'Photo style guidelines' },
					'applications': { title: 'Applications', description: 'Brand applications' }
				};
				
				steps = data.stepHistory
					.filter((stepItem: any) => stepItem.approved && stepItem.content)
					.map((stepItem: any) => {
						const stepInfo = stepTitleMap[stepItem.step] || { 
							title: stepItem.step, 
							description: '' 
						};
						
						return {
							stepId: stepItem.step,
							stepTitle: stepInfo.title,
							stepDescription: stepInfo.description,
							content: stepItem.content // Raw AI content (string) - this is what StepSlide expects!
						};
					});
			} else {
				// Fallback: Try to extract from structured data (legacy format)
				const stepMapping = [
					{ id: 'brand-positioning', title: 'Brand Positioning', description: 'Brand identity and positioning' },
					{ id: 'logo-guidelines', title: 'Logo Guidelines', description: 'Logo usage and specifications' },
					{ id: 'color-palette', title: 'Color Palette', description: 'Brand color system' },
					{ id: 'typography', title: 'Typography', description: 'Font selection and usage' },
					{ id: 'iconography', title: 'Iconography', description: 'Icon style and examples' },
					{ id: 'photography', title: 'Photography', description: 'Photo style guidelines' },
					{ id: 'applications', title: 'Applications', description: 'Brand applications' }
				];

				steps = stepMapping.map((stepDef) => {
					let content = null;
					
					if (stepDef.id === 'brand-positioning') {
						content = {
							positioning_statement: data.positioning_statement || '',
							mission: data.mission || '',
							vision: data.vision || '',
							values: data.values || [],
							voice_and_tone: data.voice_and_tone || {}
						};
					} else if (stepDef.id === 'logo-guidelines') {
						content = data.logo || {};
					} else if (stepDef.id === 'color-palette') {
						content = data.colors || {};
					} else if (stepDef.id === 'typography') {
						content = data.typography || {};
					} else if (stepDef.id === 'iconography') {
						content = data.iconography || {};
					} else if (stepDef.id === 'photography') {
						content = data.photography || {};
					} else if (stepDef.id === 'applications') {
						content = data.applications || [];
					}

					return {
						stepId: stepDef.id,
						stepTitle: stepDef.title,
						stepDescription: stepDef.description,
						content: content
					};
				}).filter((step) => step.content && Object.keys(step.content).length > 0);
			}

			console.log('StepViewer - Final steps for display:', steps);

		} catch (error) {
			console.error('Error parsing structured data:', error);
			steps = [];
		}
	}
</script>

<div class="step-viewer">
	<div class="steps-stack">
		{#each steps as step, index}
			<div class="step-container mb-6" id="step-{index}">
				<StepSlide
					stepData={step.content}
					stepTitle={step.stepTitle}
					stepDescription={step.stepDescription}
					stepId={step.stepId}
					isGenerating={false}
					onApprove={() => {}}
					onRegenerate={() => {}}
					onRevert={() => {}}
					isApproved={true}
					canRevert={false}
					{logoFiles}
					stepIndex={index}
					isLastStep={false}
					showApproveButton={false}
					readOnly={true}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.step-viewer {
		max-width: 1200px;
		margin: 0 auto;
	}

	.steps-stack {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.step-container {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

