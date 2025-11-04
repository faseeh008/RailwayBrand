// Environment variable loader for SvelteKit
import { config } from 'dotenv';

// Load environment variables
config();

// Export environment variables with fallbacks
export const env = {
	// Auth
	AUTH_SECRET: process.env.AUTH_SECRET || 'fallback-secret-key',
	AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST === 'true',

	// Google OAuth
	AUTH_GOOGLE_ID: (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '').replace(
		/^https?:\/\//,
		''
	),
	AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',

	// GitHub OAuth
	AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID || '',
	AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET || '',

	// Database
	DATABASE_URL: process.env.DATABASE_URL || '',

	// Email
	EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || '',
	EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT ? Number(process.env.EMAIL_SERVER_PORT) : 587,
	EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || '',
	EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD || '',
	EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || '',

	// Google Gemini API
	GOOGLE_GEMINI_API: process.env.GOOGLE_GEMINI_API || process.env.Google_Gemini_Api || '',

	// Environment
	NODE_ENV: process.env.NODE_ENV || 'development'
};

// Debug log
console.log('[env] Environment variables loaded:', {
	AUTH_GOOGLE_ID: env.AUTH_GOOGLE_ID ? 'SET' : 'NOT SET',
	AUTH_GOOGLE_SECRET: env.AUTH_GOOGLE_SECRET ? 'SET' : 'NOT SET',
	AUTH_SECRET: env.AUTH_SECRET ? 'SET' : 'NOT SET',
	GOOGLE_GEMINI_API: env.GOOGLE_GEMINI_API ? 'SET' : 'NOT SET'
});
