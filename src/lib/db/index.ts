import { drizzle } from 'drizzle-orm/postgres-js';
import '../env'; // ensure .env is loaded before reading DATABASE_URL
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString =
	process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/local';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Re-export schema tables for easy importing
export {
	user,
	account,
	session,
	verificationToken,
	brandGuidelines,
	pdfsBrandGuidelines,
	generatedSlides,
	analysisResults,
	scrapedWebpages,
	complianceIssues,
	auditSessions
} from './schema.js';
