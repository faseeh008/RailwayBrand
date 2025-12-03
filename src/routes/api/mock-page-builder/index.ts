import type { BrandSessionData } from './buildMinimalistic';
import { buildMinimalistic } from './buildMinimalistic';
import { buildMaximalistic } from './buildMaximalistic';
import { buildFunky } from './buildFunky';
import { buildFuturistic } from './buildFuturistic';
import { existsSync } from 'fs';
import { join } from 'path';

export type Vibe = 'Minimalistic' | 'Maximalistic' | 'Funky' | 'Futuristic';

export async function buildMockPage(sessionData: BrandSessionData, vibe: Vibe): Promise<string> {
	console.log(`[buildMockPage] Building ${vibe} theme for brand: ${sessionData.brand_name}`);
	console.log('[buildMockPage] Current working directory:', process.cwd());
	console.log('[buildMockPage] Checking template directories...');
	
	const templates = ['Minimalistic', 'Maximalistic', 'Funky', 'Futuristic'];
	for (const template of templates) {
		const buildPath = join(process.cwd(), 'react-templates', template, 'build');
		const sourcePath = join(process.cwd(), 'react-templates', template);
		console.log(`[buildMockPage] ${template}:`, {
			buildExists: existsSync(buildPath),
			sourceExists: existsSync(sourcePath),
			buildIndexExists: existsSync(join(buildPath, 'index.html')),
			sourceIndexExists: existsSync(join(sourcePath, 'index.html'))
		});
	}
	
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

