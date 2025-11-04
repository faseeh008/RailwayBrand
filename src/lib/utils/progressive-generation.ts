// Define the generation steps (without final-review as it's no longer needed)
export const GENERATION_STEPS = [
	'brand-positioning',
	'logo-guidelines',
	'color-palette',
	'typography',
	'iconography',
	'photography',
	'applications'
] as const;

export type GenerationStep = (typeof GENERATION_STEPS)[number];

export interface ProgressiveGenerationRequest {
	step: GenerationStep | 'final-review';
	previousSteps?: any;
	userApproval?: boolean;
	feedback?: string;
}

export function getNextStep(currentStep: GenerationStep): GenerationStep | null {
	const currentIndex = GENERATION_STEPS.indexOf(currentStep);
	if (currentIndex === -1 || currentIndex === GENERATION_STEPS.length - 1) {
		return null;
	}
	return GENERATION_STEPS[currentIndex + 1];
}

export function getProgress(currentStep: GenerationStep): number {
	const currentIndex = GENERATION_STEPS.indexOf(currentStep);
	return Math.round(((currentIndex + 1) / GENERATION_STEPS.length) * 100);
}
