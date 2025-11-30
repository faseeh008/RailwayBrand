import type { BrandSessionData } from './buildMinimalistic';
import { buildMinimalistic } from './buildMinimalistic';
import { buildMaximalistic } from './buildMaximalistic';
import { buildFunky } from './buildFunky';
import { buildFuturistic } from './buildFuturistic';

export type Vibe = 'Minimalistic' | 'Maximalistic' | 'Funky' | 'Futuristic';

export async function buildMockPage(sessionData: BrandSessionData, vibe: Vibe): Promise<string> {
	console.log(`[buildMockPage] Building ${vibe} theme for brand: ${sessionData.brand_name}`);
	
	switch (vibe) {
		case 'Minimalistic':
			return await buildMinimalistic(sessionData);
		case 'Maximalistic':
			return await buildMaximalistic(sessionData);
		case 'Funky':
			return await buildFunky(sessionData);
		case 'Futuristic':
			return await buildFuturistic(sessionData);
		default:
			throw new Error(`Unknown vibe: ${vibe}`);
	}
}

export { buildMinimalistic, buildMaximalistic, buildFunky, buildFuturistic };
export type { BrandSessionData };

