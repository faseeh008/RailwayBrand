import { json } from '@sveltejs/kit';
import { generateStepTitles } from '$lib/services/gemini';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { brand_domain, brand_name, short_description, selectedMood, selectedAudience } =
			await request.json();

		if (!brand_domain || !brand_name) {
			return json({ error: 'Brand domain and name are required' }, { status: 400 });
		}

		const generatedSteps = await generateStepTitles({
			brand_domain,
			brand_name,
			short_description: short_description || '',
			selectedMood: selectedMood || '',
			selectedAudience: selectedAudience || ''
		});

		return json(generatedSteps);
	} catch (error) {
		console.error('Error generating step titles:', error);
		return json({ error: 'Failed to generate step titles' }, { status: 500 });
	}
};
