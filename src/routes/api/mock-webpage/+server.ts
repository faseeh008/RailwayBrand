import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ThemeKey } from '$lib/types/theme-content';
import { normalizeTheme, buildThemeConfig } from './theme-config';
import { buildMockWebpageHtml } from './template-writer';

interface BuildRequest {
	brandData: any;
	theme: ThemeKey;
	slides?: Array<{ name: string; html: string }>;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { brandData, theme, slides = [] } = (await request.json()) as BuildRequest;
		const normalizedTheme = normalizeTheme(theme);

		const config = await buildThemeConfig(brandData, normalizedTheme, slides);
		const build = await buildMockWebpageHtml(config);

		return json({
			success: true,
			...build
		});
	} catch (error: any) {
		console.error('mock-webpage generator error', error);
		return json(
			{
				success: false,
				error: error?.message || 'Failed to generate mock webpage'
			},
			{ status: 500 }
		);
	}
};

