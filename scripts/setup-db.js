#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { config } from 'dotenv';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error('❌ DATABASE_URL not found in environment variables');
	process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function setupDatabase() {
	try {
		console.log('🔄 Running database migrations...');
		await migrate(db, { migrationsFolder: './drizzle' });
		console.log('✅ Database migrations completed successfully!');

		console.log('\n📊 You can now run the following commands:');
		console.log('  npm run dev        - Start development server');
		console.log('  npm run db:studio  - Open Drizzle Studio');
	} catch (error) {
		console.error('❌ Database setup failed:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

setupDatabase();
