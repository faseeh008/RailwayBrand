// Script to migrate existing hardcoded guidelines to database
import { db } from './index.js';
import { brandGuidelines } from './schema.js';
import { eq } from 'drizzle-orm';
// Note: Import these if they exist, otherwise create placeholder functions
// import { githubBrandGuideline } from '../githubBrandGuideline.js';
// import { bufferBrandGuideline } from '../bufferBrandGuideline.js';
// import { appleBrandGuideline } from '../appleBrandGuideline.js';
// import { mockBrandGuideline } from '../mockBrandGuideline.js';

// Convert existing guidelines to database format
function convertGuidelineToDbFormat(guideline: any) {
	return {
		userId: 'system', // System user ID for migrated guidelines
		brandName: guideline.metadata?.brandName || guideline.brandName || 'Unknown',
		content: JSON.stringify(guideline),
		industry: 'Technology', // Default industry
		colors: JSON.stringify(guideline.colors || {}),
		typography: JSON.stringify(guideline.typography || {}),
		structuredData: JSON.stringify({
			colors: guideline.colors,
			typography: guideline.typography,
			logo: guideline.logo,
			ui: guideline.ui,
			spacing: guideline.spacing,
			layout: guideline.layout,
			imagery: guideline.imagery,
			tone: guideline.tone,
			accessibility: guideline.accessibility,
			globalRules: guideline.globalRules,
			metadata: guideline.metadata
		}),
		brandDomain: guideline.metadata?.sourceUrl || '',
		shortDescription: guideline.metadata?.brandName || ''
	};
}

export async function migrateGuidelines(guidelinesData?: Array<{ name: string; data: any }>) {
	console.log('🚀 Starting guideline migration...');

	// Default guidelines if none provided
	const guidelines =
		guidelinesData ||
		[
			// Add your guideline imports here when available
			// { name: 'GitHub', data: githubBrandGuideline },
			// { name: 'Buffer', data: bufferBrandGuideline },
			// { name: 'Apple', data: appleBrandGuideline },
			// { name: 'Mock', data: mockBrandGuideline }
		];

	if (guidelines.length === 0) {
		console.log('⚠️  No guidelines to migrate');
		return;
	}

	for (const { name, data } of guidelines) {
		try {
			console.log(`📋 Migrating ${name} guidelines...`);

			const dbFormat = convertGuidelineToDbFormat(data);

			// Check if already exists
			const existing = await db
				.select()
				.from(brandGuidelines)
				.where(eq(brandGuidelines.brandName, dbFormat.brandName))
				.limit(1);

			if (existing.length > 0) {
				console.log(`⚠️  ${name} guidelines already exist, skipping...`);
				continue;
			}

			// Insert the guideline
			const result = await db.insert(brandGuidelines).values(dbFormat).returning({ id: brandGuidelines.id });

			console.log(`✅ Successfully migrated ${name} guidelines (ID: ${result[0]?.id})`);
		} catch (error: any) {
			console.error(`❌ Failed to migrate ${name} guidelines:`, error.message);
		}
	}

	console.log('🎉 Migration completed!');

	// Show statistics
	const allGuidelines = await db.select().from(brandGuidelines);
	const activeCount = allGuidelines.filter((g) => g.isActive).length;
	const recentCount = allGuidelines.filter(
		(g) => g.updatedAt && new Date(g.updatedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
	).length;

	console.log('\n📊 Database Statistics:');
	console.log(`   Total guidelines: ${allGuidelines.length}`);
	console.log(`   Active guidelines: ${activeCount}`);
	console.log(`   Recently updated: ${recentCount}`);
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	migrateGuidelines().catch(console.error);
}

