/**
 * Model configuration for Smart AI Agent
 * Defines rate limits and fallback chains
 */

import type { ModelLimits, ModelConfig, TaskType } from '$lib/types/presentation-agent';

// ═══════════════════════════════════════════════════════════════
// GROQ MODEL LIMITS (Free Tier)
// ═══════════════════════════════════════════════════════════════

export const GROQ_LIMITS: Record<string, ModelLimits> = {
	'qwen/qwen3-32b': {
		rpm: 60, // Fastest! Double the RPM
		rpd: 1000,
		tpm: 6000,
		tpd: 500000
	},
	'llama-3.3-70b-versatile': {
		rpm: 30,
		rpd: 1000,
		tpm: 12000, // Best TPM for complex tasks
		tpd: 100000
	},
	'meta-llama/llama-4-scout-17b-16e-instruct': {
		rpm: 30,
		rpd: 1000,
		tpm: 30000, // Excellent for vision tasks
		tpd: 500000
	},
	'meta-llama/llama-4-maverick-17b-128e-instruct': {
		rpm: 30,
		rpd: 1000,
		tpm: 6000, // Vision model
		tpd: 500000
	},
	'openai/gpt-oss-120b': {
		rpm: 30,
		rpd: 1000,
		tpm: 8000,
		tpd: 200000
	},
	'openai/gpt-oss-20b': {
		rpm: 30,
		rpd: 1000,
		tpm: 8000,
		tpd: 200000
	},
	'llama-3.1-8b-instant': {
		rpm: 30,
		rpd: 14400,
		tpm: 6000,
		tpd: 500000
	}
};

// ═══════════════════════════════════════════════════════════════
// GEMINI MODEL LIMITS
// ═══════════════════════════════════════════════════════════════

export const GEMINI_LIMITS: Record<string, ModelLimits> = {
	'gemini-2.5-flash': {
		rpm: 2000, // Much higher limits
		rpd: 50000,
		tpm: 1000000,
		tpd: 50000000
	}
};

// ═══════════════════════════════════════════════════════════════
// FALLBACK CHAINS BY TASK
// ═══════════════════════════════════════════════════════════════

export const FALLBACK_CHAINS: Record<TaskType, ModelConfig[]> = {
	// Fast classification task - use fastest models first
	contentAnalysis: [
		{ model: 'qwen/qwen3-32b', provider: 'groq' }, // 60 RPM - fastest!
		{ model: 'llama-3.1-8b-instant', provider: 'groq' }, // 30 RPM
		{ model: 'llama-3.3-70b-versatile', provider: 'groq' }, // 30 RPM
		{ model: 'gemini-2.5-flash', provider: 'gemini' } // Unlimited backup
	],

	// Complex creative task - use best reasoning models
	layoutDesign: [
		{ model: 'llama-3.3-70b-versatile', provider: 'groq' }, // Best reasoning + 12K TPM
		{ model: 'openai/gpt-oss-120b', provider: 'groq' }, // Good reasoning
		{ model: 'gemini-2.5-flash', provider: 'gemini' } // Fast and reliable
	],

	// Vision task - only models with vision capability
	logoAnalysis: [
		{ model: 'meta-llama/llama-4-scout-17b-16e-instruct', provider: 'groq' }, // 30K TPM - excellent for vision
		{ model: 'gemini-2.5-flash', provider: 'gemini' } // Vision backup
	],

	// Logical decision - use fast models
	overflowDecision: [
		{ model: 'qwen/qwen3-32b', provider: 'groq' }, // Fast
		{ model: 'llama-3.3-70b-versatile', provider: 'groq' }, // Good at logic
		{ model: 'gemini-2.5-flash', provider: 'gemini' } // Backup
	],

	// Rule-based validation - use fast models
	validation: [
		{ model: 'qwen/qwen3-32b', provider: 'groq' }, // Fastest
		{ model: 'llama-3.1-8b-instant', provider: 'groq' }, // Fast backup
		{ model: 'gemini-2.5-flash', provider: 'gemini' } // Always available
	]
};

// ═══════════════════════════════════════════════════════════════
// TOKEN ESTIMATION CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const TOKEN_ESTIMATION = {
	// Rough estimation: 1 token ≈ 4 characters
	CHARS_PER_TOKEN: 4,

	// Buffer for safety (add 20% to estimates)
	SAFETY_BUFFER: 1.2,

	// Minimum tokens to reserve
	MIN_TOKENS_RESERVE: 100
};

// ═══════════════════════════════════════════════════════════════
// TIMEOUT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const TIMEOUTS = {
	// API call timeouts (milliseconds)
	GROQ_API_TIMEOUT: 30000, // 30 seconds
	GEMINI_API_TIMEOUT: 120000, // 120 seconds (2 minutes) for complex batch processing

	// Retry delays (milliseconds)
	RETRY_DELAY_MS: 1000, // 1 second
	MAX_RETRIES: 3,

	// Rate limit reset wait
	RATE_LIMIT_WAIT_MS: 60000 // 60 seconds
};

// ═══════════════════════════════════════════════════════════════
// SLIDE TYPE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const SLIDE_TYPES = {
	HERO: 'hero_slide',
	TEXT_HEAVY: 'text_heavy_slide',
	LIST: 'list_slide',
	VISUAL_GRID: 'visual_grid',
	CARD_LAYOUT: 'card_layout',
	TYPOGRAPHY_SHOWCASE: 'typography_showcase',
	IMAGE_TEXT_SPLIT: 'image_text_split',
	COMPARISON: 'comparison_slide',
	COVER: 'cover_slide',
	CLOSING: 'closing_slide'
} as const;

// ═══════════════════════════════════════════════════════════════
// LAYOUT CONSTRAINTS
// ═══════════════════════════════════════════════════════════════

export const LAYOUT_CONSTRAINTS = {
	// Slide dimensions (16:9 aspect ratio)
	SLIDE_WIDTH: 10, // inches
	SLIDE_HEIGHT: 5.625, // inches

	// Safe area margins
	MARGIN_TOP: 0.5,
	MARGIN_BOTTOM: 0.5,
	MARGIN_LEFT: 0.5,
	MARGIN_RIGHT: 0.5,

	// Grid system
	GRID_UNIT: 0.25, // 0.25" grid

	// Typography
	MIN_FONT_SIZE: 14,
	MAX_FONT_SIZE: 72,
	DEFAULT_FONT_SIZE: 16,
	TITLE_FONT_SIZE: 36,
	HEADING_FONT_SIZE: 28,
	BODY_FONT_SIZE: 16,
	CAPTION_FONT_SIZE: 12,

	// Spacing
	MIN_SPACING: 0.25,
	DEFAULT_SPACING: 0.5,

	// Line height
	LINE_HEIGHT_MULTIPLIER: 1.4,

	// Contrast ratio (WCAG AA)
	MIN_CONTRAST_RATIO: 4.5
};

// ═══════════════════════════════════════════════════════════════
// ERROR MESSAGES
// ═══════════════════════════════════════════════════════════════

export const ERROR_MESSAGES = {
	NO_API_KEY: 'API key not configured. Please check environment variables.',
	ALL_MODELS_EXHAUSTED: 'All models have reached their rate limits. Please try again later.',
	INVALID_RESPONSE: 'Received invalid response from AI model.',
	PARSING_FAILED: 'Failed to parse AI response as JSON.',
	NETWORK_ERROR: 'Network error occurred while calling AI API.',
	TIMEOUT_ERROR: 'API call timed out. Please try again.',
	GENERATION_FAILED: 'Failed to generate presentation.',
	INVALID_INPUT: 'Invalid input data provided.',
	NO_CONTENT: 'No content provided for generation.'
};

// ═══════════════════════════════════════════════════════════════
// LOGGING CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const LOGGING = {
	ENABLED: true,
	LOG_LEVEL: 'info' as 'debug' | 'info' | 'warn' | 'error',
	LOG_TOKENS: true,
	LOG_TIMING: true
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all model limits (Groq + Gemini)
 */
export function getAllModelLimits(): Record<string, ModelLimits> {
	return { ...GROQ_LIMITS, ...GEMINI_LIMITS };
}

/**
 * Check if model is a Groq model
 */
export function isGroqModel(model: string): boolean {
	return model in GROQ_LIMITS;
}

/**
 * Check if model is a Gemini model
 */
export function isGeminiModel(model: string): boolean {
	return model in GEMINI_LIMITS;
}

/**
 * Get provider for a model
 */
export function getProvider(model: string): 'groq' | 'gemini' | null {
	if (isGroqModel(model)) return 'groq';
	if (isGeminiModel(model)) return 'gemini';
	return null;
}

/**
 * Estimate tokens from text
 */
export function estimateTokens(text: string): number {
	const baseEstimate = Math.ceil(text.length / TOKEN_ESTIMATION.CHARS_PER_TOKEN);
	const withBuffer = Math.ceil(baseEstimate * TOKEN_ESTIMATION.SAFETY_BUFFER);
	return Math.max(withBuffer, TOKEN_ESTIMATION.MIN_TOKENS_RESERVE);
}

