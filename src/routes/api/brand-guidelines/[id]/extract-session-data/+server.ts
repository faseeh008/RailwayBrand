import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { brandGuidelines } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const guideline = await db
			.select()
			.from(brandGuidelines)
			.where(and(
				eq(brandGuidelines.id, params.id),
				eq(brandGuidelines.userId, session.user.id)
			))
			.limit(1);

		if (guideline.length === 0) {
			return json({ error: 'Brand guideline not found' }, { status: 404 });
		}

		const guidelineData = guideline[0];
		
		// Parse colors JSON
		let colorsData: any = {};
		if (guidelineData.colors) {
			try {
				colorsData = typeof guidelineData.colors === 'string' 
					? JSON.parse(guidelineData.colors) 
					: guidelineData.colors;
			} catch (e) {
				console.warn('Failed to parse colors:', e);
			}
		}

		// Extract color values - handle different possible structures
		let primaryColor = '';
		let secondaryColor = '';
		let accentColor = '';

		// Try different possible color structures
		if (colorsData?.semantic?.primary?.hex) {
			primaryColor = colorsData.semantic.primary.hex;
		} else if (colorsData?.primary?.hex) {
			primaryColor = colorsData.primary.hex;
		} else if (colorsData?.primary?.value) {
			primaryColor = colorsData.primary.value;
		} else if (Array.isArray(colorsData?.primary) && colorsData.primary[0]?.value) {
			primaryColor = colorsData.primary[0].value;
		} else if (typeof colorsData?.primary === 'string') {
			primaryColor = colorsData.primary;
		}

		if (colorsData?.semantic?.secondary?.hex) {
			secondaryColor = colorsData.semantic.secondary.hex;
		} else if (colorsData?.secondary?.hex) {
			secondaryColor = colorsData.secondary.hex;
		} else if (colorsData?.secondary?.value) {
			secondaryColor = colorsData.secondary.value;
		} else if (Array.isArray(colorsData?.secondary) && colorsData.secondary[0]?.value) {
			secondaryColor = colorsData.secondary[0].value;
		} else if (typeof colorsData?.secondary === 'string') {
			secondaryColor = colorsData.secondary;
		}

		if (colorsData?.semantic?.accent?.hex) {
			accentColor = colorsData.semantic.accent.hex;
		} else if (colorsData?.accent?.hex) {
			accentColor = colorsData.accent.hex;
		} else if (colorsData?.accent?.value) {
			accentColor = colorsData.accent.value;
		} else if (Array.isArray(colorsData?.accent) && colorsData.accent[0]?.value) {
			accentColor = colorsData.accent[0].value;
		} else if (typeof colorsData?.accent === 'string') {
			accentColor = colorsData.accent;
		}

		// Build the session data object
		const sessionData = {
			brand_name: guidelineData.brandName || '',
			brand_industry: guidelineData.industry || guidelineData.brandDomain || '',
			vibe: guidelineData.mood || '',
			colors: {
				primary: primaryColor,
				secondary: secondaryColor,
				accent: accentColor
			}
		};

		return json({
			success: true,
			data: sessionData
		});
	} catch (error) {
		console.error('Error extracting session data:', error);
		return json({ error: 'Failed to extract session data' }, { status: 500 });
	}
};

