/**
 * Smart Model Router with Automatic Fallback
 * Orchestrates API calls across Groq and Gemini with intelligent fallback
 */

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$lib/env';
import { UsageTracker } from './usage-tracker';
import {
	FALLBACK_CHAINS,
	TIMEOUTS,
	ERROR_MESSAGES,
	LOGGING,
	estimateTokens
} from '$lib/config/model-config';
import type {
	AIResponse,
	ModelCallResult,
	TaskType,
	ModelConfig
} from '$lib/types/presentation-agent';

export class SmartModelRouter {
	private groq: Groq | null = null;
	private gemini: GoogleGenerativeAI | null = null;
	private tracker: UsageTracker;

	constructor(tracker: UsageTracker) {
		this.tracker = tracker;
		this.initializeClients();
	}

	/**
	 * Initialize API clients with error handling
	 */
	private initializeClients(): void {
		try {
			// Initialize Groq if API key exists
			if (env.GROQ_API_KEY) {
				this.groq = new Groq({ apiKey: env.GROQ_API_KEY });
				if (LOGGING.ENABLED) {
					console.log('✅ Groq client initialized');
				}
			} else {
				console.warn('⚠️ GROQ_API_KEY not found - Groq models unavailable');
			}

			// Initialize Gemini if API key exists
			if (env.GOOGLE_GEMINI_API) {
				this.gemini = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API);
				if (LOGGING.ENABLED) {
					console.log('✅ Gemini client initialized');
				}
			} else {
				console.warn('⚠️ GOOGLE_GEMINI_API not found - Gemini models unavailable');
			}

			// Validate at least one client is available
			if (!this.groq && !this.gemini) {
				throw new Error(ERROR_MESSAGES.NO_API_KEY);
			}
		} catch (error: any) {
			console.error('❌ Failed to initialize AI clients:', error.message);
			throw error;
		}
	}

	/**
	 * Execute AI task with automatic fallback
	 */
	async executeWithFallback<T>(
		taskType: TaskType,
		promptBuilder: (provider: 'groq' | 'gemini') => any,
		estimatedTokens?: number,
		parser?: (response: string) => T
	): Promise<T> {
		const startTime = Date.now();
		const chain = FALLBACK_CHAINS[taskType];

		if (!chain || chain.length === 0) {
			throw new Error(`No fallback chain defined for task: ${taskType}`);
		}

		// Estimate tokens if not provided
		const tokens = estimatedTokens || 2000;

		if (LOGGING.ENABLED) {
			console.log(`\n🎯 Starting task: ${taskType}`);
			console.log(`📊 Estimated tokens: ${tokens}`);
			console.log(`🔗 Fallback chain: ${chain.map((c) => c.model).join(' → ')}`);
		}

		let lastError: Error | null = null;
		let attemptNumber = 0;

		// Try each model in the fallback chain
		for (const modelConfig of chain) {
			attemptNumber++;

			// Check if model is available before attempting
			if (!this.tracker.canUseModel(modelConfig.model, tokens)) {
				if (LOGGING.ENABLED) {
					console.log(`⏭️ Skipping ${modelConfig.model} (rate limited)`);
				}
				continue;
			}

			if (LOGGING.ENABLED) {
				console.log(
					`\n🔄 Attempt ${attemptNumber}/${chain.length}: ${modelConfig.model} (${modelConfig.provider})`
				);
			}

			try {
				// Execute API call
				const response = await this.callModel(modelConfig, promptBuilder, tokens);

				// Record successful usage
				this.tracker.recordUsage(modelConfig.model, response.tokensUsed);

				if (LOGGING.ENABLED && LOGGING.LOG_TIMING) {
					const duration = Date.now() - startTime;
					console.log(
						`✅ Success! Model: ${modelConfig.model}, Tokens: ${response.tokensUsed}, Time: ${duration}ms`
					);
				}

				// Parse response
				const parsedResult = parser ? parser(response.content) : this.parseJSON<T>(response.content);

				return parsedResult;
			} catch (error: any) {
				lastError = error;

				// Handle different error types
				if (this.isRateLimitError(error)) {
					console.warn(`⚠️ Rate limit hit on ${modelConfig.model}, trying next model...`);
					// Mark as exhausted
					this.tracker.recordUsage(modelConfig.model, tokens);
					continue;
				} else if (this.isTimeoutError(error)) {
					console.warn(`⏱️ Timeout on ${modelConfig.model}, trying next model...`);
					continue;
				} else if (this.isNetworkError(error)) {
					console.warn(`🌐 Network error on ${modelConfig.model}, trying next model...`);
					continue;
				} else {
					// Other errors - log and continue to next model
					console.error(
						`❌ Error with ${modelConfig.model}:`,
						error.message || error.toString()
					);
					continue;
				}
			}
		}

		// All models failed
		const duration = Date.now() - startTime;
		const errorMessage =
			lastError?.message ||
			`${ERROR_MESSAGES.ALL_MODELS_EXHAUSTED} Task: ${taskType}, Duration: ${duration}ms`;

		console.error(`\n❌ All models failed for task: ${taskType}`);
		console.error(`Last error: ${errorMessage}`);

		throw new Error(errorMessage);
	}

	/**
	 * Call a specific model (Groq or Gemini)
	 */
	private async callModel(
		config: ModelConfig,
		promptBuilder: (provider: 'groq' | 'gemini') => any,
		estimatedTokens: number
	): Promise<AIResponse> {
		if (config.provider === 'groq') {
			return await this.callGroq(config.model, promptBuilder('groq'));
		} else {
			return await this.callGemini(config.model, promptBuilder('gemini'));
		}
	}

	/**
	 * Call Groq API
	 */
	private async callGroq(model: string, messages: any): Promise<AIResponse> {
		if (!this.groq) {
			throw new Error('Groq client not initialized');
		}

		try {
			// Handle both single prompt and messages array
			const groqMessages = Array.isArray(messages) ? messages : [messages];

			// Add timeout
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(() => reject(new Error('Groq API timeout')), TIMEOUTS.GROQ_API_TIMEOUT);
			});

			const apiPromise = this.groq.chat.completions.create({
				model,
				messages: groqMessages,
				response_format: { type: 'json_object' },
				temperature: 0.3,
				max_tokens: 6000
			});

			const completion = await Promise.race([apiPromise, timeoutPromise]);

			const content = completion.choices[0]?.message?.content || '{}';
			const tokensUsed = completion.usage?.total_tokens || estimateTokens(content);

			return {
				content,
				tokensUsed,
				model,
				provider: 'groq'
			};
		} catch (error: any) {
			// Re-throw with context
			throw new Error(`Groq API error (${model}): ${error.message}`);
		}
	}

	/**
	 * Call Gemini API
	 */
	private async callGemini(modelName: string, prompt: any): Promise<AIResponse> {
		if (!this.gemini) {
			throw new Error('Gemini client not initialized');
		}

		try {
			const model = this.gemini.getGenerativeModel({ model: modelName });

			// Add timeout
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(() => reject(new Error('Gemini API timeout')), TIMEOUTS.GEMINI_API_TIMEOUT);
			});

			const apiPromise = model.generateContent(prompt);

			const result = await Promise.race([apiPromise, timeoutPromise]);
			const response = await result.response;
			const content = response.text();

			// Estimate tokens (Gemini doesn't always return usage)
			const tokensUsed = estimateTokens(content);

			return {
				content,
				tokensUsed,
				model: modelName,
				provider: 'gemini'
			};
		} catch (error: any) {
			// Re-throw with context
			throw new Error(`Gemini API error (${modelName}): ${error.message}`);
		}
	}

	/**
	 * Parse JSON response with error handling
	 */
	private parseJSON<T>(text: string): T {
		try {
			// Try direct parsing
			return JSON.parse(text);
		} catch (error) {
			// Try extracting JSON from markdown code blocks
			const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
			if (jsonMatch) {
				try {
					return JSON.parse(jsonMatch[1]);
				} catch (e) {
					// Continue to fallback
				}
			}

			// Try extracting JSON object
			const objectMatch = text.match(/\{[\s\S]*\}/);
			if (objectMatch) {
				try {
					return JSON.parse(objectMatch[0]);
				} catch (e) {
					// Continue to error
				}
			}

			// Try extracting JSON array
			const arrayMatch = text.match(/\[[\s\S]*\]/);
			if (arrayMatch) {
				try {
					return JSON.parse(arrayMatch[0]);
				} catch (e) {
					// All parsing attempts failed
				}
			}

			console.error('Failed to parse JSON:', text.substring(0, 200));
			throw new Error(ERROR_MESSAGES.PARSING_FAILED);
		}
	}

	/**
	 * Check if error is a rate limit error
	 */
	private isRateLimitError(error: any): boolean {
		const errorStr = error?.message?.toLowerCase() || error?.toString().toLowerCase() || '';
		return (
			error?.status === 429 ||
			errorStr.includes('rate limit') ||
			errorStr.includes('too many requests') ||
			errorStr.includes('quota exceeded')
		);
	}

	/**
	 * Check if error is a timeout error
	 */
	private isTimeoutError(error: any): boolean {
		const errorStr = error?.message?.toLowerCase() || error?.toString().toLowerCase() || '';
		return errorStr.includes('timeout') || errorStr.includes('timed out');
	}

	/**
	 * Check if error is a network error
	 */
	private isNetworkError(error: any): boolean {
		const errorStr = error?.message?.toLowerCase() || error?.toString().toLowerCase() || '';
		return (
			errorStr.includes('network') ||
			errorStr.includes('econnrefused') ||
			errorStr.includes('enotfound') ||
			errorStr.includes('connection')
		);
	}

	/**
	 * Get usage report from tracker
	 */
	getUsageReport(): Record<string, any> {
		return this.tracker.getUsageReport();
	}

	/**
	 * Get usage summary
	 */
	getUsageSummary(): any {
		return this.tracker.getSummary();
	}
}

