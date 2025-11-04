/**
 * Migration script to convert existing logo files from filesystem to database
 * 
 * This script:
 * 1. Reads all brand guidelines with logoFiles
 * 2. For each logo file path, reads the file from filesystem
 * 3. Converts to base64 data URL
 * 4. Updates the database record with logoData field
 * 
 * Run with: node --loader ts-node/esm scripts/migrate-logos-to-db.ts
 * Or add to package.json scripts
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

// Define schema inline for the script
const brandGuidelines = pgTable('brand_guidelines', {
	id: text('id').primaryKey(),
	userId: text('userId').notNull(),
	brandName: text('brandName').notNull(),
	logoFiles: text('logoFiles'),
	logoData: text('logoData'),
	// ... other fields not needed for this migration
});

// Initialize database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('❌ DATABASE_URL not found in environment variables');
	process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function migrateLogos() {
	console.log('🚀 Starting logo migration from filesystem to database...\n');

	try {
		// Fetch all brand guidelines
		const allGuidelines = await db.select().from(brandGuidelines);
		console.log(`📊 Found ${allGuidelines.length} brand guidelines records\n`);

		let migratedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		for (const guideline of allGuidelines) {
			try {
				// Skip if already has logoData
				if (guideline.logoData) {
					console.log(`⏭️  Skipping ${guideline.brandName} - already has logoData`);
					skippedCount++;
					continue;
				}

				// Parse logo files
				let logoFiles = [];
				if (guideline.logoFiles) {
					try {
						logoFiles = JSON.parse(guideline.logoFiles);
					} catch (e) {
						console.log(`⚠️  ${guideline.brandName} - Invalid logoFiles JSON`);
						errorCount++;
						continue;
					}
				}

				// Skip if no logo files
				if (logoFiles.length === 0) {
					console.log(`⏭️  Skipping ${guideline.brandName} - no logo files`);
					skippedCount++;
					continue;
				}

				// Get the first logo file
				const logoFile = logoFiles[0];
				
				// Check if it has a file path
				if (!logoFile.filePath) {
					console.log(`⚠️  ${guideline.brandName} - no filePath in logo file`);
					errorCount++;
					continue;
				}

				// Construct full file path
				let fullPath = logoFile.filePath;
				if (fullPath.startsWith('/uploads/')) {
					fullPath = join(process.cwd(), 'static', fullPath);
				} else if (fullPath.startsWith('static/')) {
					fullPath = join(process.cwd(), fullPath);
				} else {
					fullPath = join(process.cwd(), logoFile.filePath);
				}

				// Check if file exists
				if (!existsSync(fullPath)) {
					console.log(`❌ ${guideline.brandName} - file not found: ${fullPath}`);
					errorCount++;
					continue;
				}

				// Read file and convert to base64
				const fileBuffer = readFileSync(fullPath);
				const base64Data = fileBuffer.toString('base64');
				
				// Determine MIME type from file extension
				const extension = logoFile.filename.split('.').pop()?.toLowerCase() || 'png';
				const mimeTypes = {
					'png': 'image/png',
					'jpg': 'image/jpeg',
					'jpeg': 'image/jpeg',
					'gif': 'image/gif',
					'svg': 'image/svg+xml',
					'webp': 'image/webp'
				};
				const mimeType = mimeTypes[extension] || 'image/png';
				
				// Create data URL
				const dataUrl = `data:${mimeType};base64,${base64Data}`;

				// Update logo files array with fileData
				const updatedLogoFiles = logoFiles.map((logo, index) => {
					if (index === 0) {
						return {
							...logo,
							fileData: dataUrl
						};
					}
					return logo;
				});

				// Update database
				await db
					.update(brandGuidelines)
					.set({
						logoData: dataUrl,
						logoFiles: JSON.stringify(updatedLogoFiles)
					})
					.where(eq(brandGuidelines.id, guideline.id));

				console.log(`✅ Migrated ${guideline.brandName} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
				migratedCount++;

			} catch (error) {
				console.error(`❌ Error migrating ${guideline.brandName}:`, error.message);
				errorCount++;
			}
		}

		console.log('\n📈 Migration Summary:');
		console.log(`   ✅ Migrated: ${migratedCount}`);
		console.log(`   ⏭️  Skipped: ${skippedCount}`);
		console.log(`   ❌ Errors: ${errorCount}`);
		console.log(`   📊 Total: ${allGuidelines.length}`);

		if (migratedCount > 0) {
			console.log('\n✨ Migration completed successfully!');
			console.log('💡 You can now safely remove old logo files from static/uploads/logos/');
		}

	} catch (error) {
		console.error('❌ Migration failed:', error);
		await client.end();
		process.exit(1);
	}

	// Close database connection
	await client.end();
	process.exit(0);
}

// Run migration
migrateLogos();
