import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables, but don't fail if .env doesn't exist
config({ path: '.env' });

export default defineConfig({
	schema: './src/lib/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/local'
	},
	verbose: true,
	strict: true
});
