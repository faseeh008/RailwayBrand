/**
 * Usage Tracker for AI Model Rate Limits
 * Tracks requests and tokens per model with time-based resets
 */

import type { UsageStats, UsageReport, ModelConfig } from '$lib/types/presentation-agent';
import { getAllModelLimits, LOGGING } from '$lib/config/model-config';

export class UsageTracker {
	private usage: Map<string, UsageStats> = new Map();
	private readonly limits = getAllModelLimits();

	constructor() {
		this.initializeTracking();
	}

	/**
	 * Initialize tracking for all available models
	 */
	private initializeTracking(): void {
		const now = Date.now();

		Object.keys(this.limits).forEach((model) => {
			this.usage.set(model, {
				requestsThisMinute: 0,
				requestsToday: 0,
				tokensThisMinute: 0,
				tokensToday: 0,
				lastResetMinute: now,
				lastResetDay: now
			});
		});

		if (LOGGING.ENABLED && LOGGING.LOG_LEVEL === 'debug') {
			console.log(`📊 Initialized tracking for ${this.usage.size} models`);
		}
	}

	/**
	 * Check if a model can handle the request
	 */
	canUseModel(model: string, estimatedTokens: number): boolean {
		const stats = this.usage.get(model);
		if (!stats) {
			console.warn(`⚠️ Model not found in tracker: ${model}`);
			return false;
		}

		// Reset counters if needed
		this.resetIfNeeded(model);

		const limits = this.limits[model];
		if (!limits) {
			console.warn(`⚠️ No limits defined for model: ${model}`);
			return false;
		}

		// Check all four limits
		const canUse =
			stats.requestsThisMinute < limits.rpm &&
			stats.requestsToday < limits.rpd &&
			stats.tokensThisMinute + estimatedTokens <= limits.tpm &&
			stats.tokensToday + estimatedTokens <= limits.tpd;

		if (!canUse && LOGGING.ENABLED && LOGGING.LOG_LEVEL === 'debug') {
			console.log(`⏳ Model ${model} cannot be used:`, {
				rpm: `${stats.requestsThisMinute}/${limits.rpm}`,
				rpd: `${stats.requestsToday}/${limits.rpd}`,
				tpm: `${stats.tokensThisMinute + estimatedTokens}/${limits.tpm}`,
				tpd: `${stats.tokensToday + estimatedTokens}/${limits.tpd}`
			});
		}

		return canUse;
	}

	/**
	 * Record usage after a successful API call
	 */
	recordUsage(model: string, tokensUsed: number): void {
		const stats = this.usage.get(model);
		if (!stats) {
			console.warn(`⚠️ Cannot record usage for unknown model: ${model}`);
			return;
		}

		// Reset if needed before recording
		this.resetIfNeeded(model);

		// Increment counters
		stats.requestsThisMinute++;
		stats.requestsToday++;
		stats.tokensThisMinute += tokensUsed;
		stats.tokensToday += tokensUsed;

		if (LOGGING.ENABLED && LOGGING.LOG_TOKENS) {
			const limits = this.limits[model];
			console.log(`📈 Recorded usage for ${model}:`, {
				requests: `${stats.requestsThisMinute}/${limits.rpm}`,
				tokens: `${stats.tokensThisMinute}/${limits.tpm}`
			});
		}
	}

	/**
	 * Reset counters if time windows have elapsed
	 */
	private resetIfNeeded(model: string): void {
		const stats = this.usage.get(model);
		if (!stats) return;

		const now = Date.now();

		// Reset minute counter (every 60 seconds)
		if (now - stats.lastResetMinute >= 60000) {
			if (LOGGING.ENABLED && LOGGING.LOG_LEVEL === 'debug') {
				console.log(`🔄 Resetting minute counters for ${model}`);
			}

			stats.requestsThisMinute = 0;
			stats.tokensThisMinute = 0;
			stats.lastResetMinute = now;
		}

		// Reset day counter (every 24 hours)
		if (now - stats.lastResetDay >= 86400000) {
			if (LOGGING.ENABLED && LOGGING.LOG_LEVEL === 'debug') {
				console.log(`🔄 Resetting daily counters for ${model}`);
			}

			stats.requestsToday = 0;
			stats.tokensToday = 0;
			stats.lastResetDay = now;
		}
	}

	/**
	 * Get current usage statistics for a model
	 */
	getStats(model: string): UsageStats | null {
		const stats = this.usage.get(model);
		if (!stats) return null;

		// Reset first to get accurate current state
		this.resetIfNeeded(model);

		// Return a copy to prevent external modification
		return { ...stats };
	}

	/**
	 * Get best available model from a fallback chain
	 */
	getBestAvailableModel(
		chain: ModelConfig[],
		estimatedTokens: number
	): ModelConfig | null {
		for (const config of chain) {
			if (this.canUseModel(config.model, estimatedTokens)) {
				if (LOGGING.ENABLED) {
					console.log(`✅ Selected ${config.model} (${config.provider}) - available`);
				}
				return config;
			} else {
				if (LOGGING.ENABLED && LOGGING.LOG_LEVEL === 'debug') {
					console.log(`⏭️ Skipping ${config.model} - rate limited`);
				}
			}
		}

		console.warn('⚠️ No available models in fallback chain');
		return null;
	}

	/**
	 * Generate usage report for all models
	 */
	getUsageReport(): Record<string, UsageReport> {
		const report: Record<string, UsageReport> = {};

		for (const [model, stats] of this.usage.entries()) {
			// Reset counters first
			this.resetIfNeeded(model);

			const limits = this.limits[model];
			if (!limits) continue;

			// Determine availability
			let availability: '✅' | '⏳' | '❌' = '✅';
			if (!this.canUseModel(model, 1000)) {
				// Check if it's temporary (minute limit) or severe (day limit)
				if (stats.requestsToday >= limits.rpd || stats.tokensToday >= limits.tpd) {
					availability = '❌'; // Daily limit reached
				} else {
					availability = '⏳'; // Minute limit reached, will reset soon
				}
			}

			// Get provider
			const provider = model.includes('gemini') ? 'gemini' : 'groq';

			report[model] = {
				model,
				provider,
				requests: {
					minute: `${stats.requestsThisMinute}/${limits.rpm}`,
					day: `${stats.requestsToday}/${limits.rpd}`
				},
				tokens: {
					minute: `${stats.tokensThisMinute}/${limits.tpm}`,
					day: `${stats.tokensToday}/${limits.tpd}`
				},
				availability
			};
		}

		return report;
	}

	/**
	 * Reset all usage counters (useful for testing)
	 */
	resetAll(): void {
		console.log('🔄 Resetting all usage counters');
		this.initializeTracking();
	}

	/**
	 * Get time until next reset
	 */
	getTimeUntilReset(model: string): { minutes: number; days: number } | null {
		const stats = this.usage.get(model);
		if (!stats) return null;

		const now = Date.now();

		const minutesRemaining = Math.max(0, Math.ceil((60000 - (now - stats.lastResetMinute)) / 1000));
		const daysRemaining = Math.max(
			0,
			Math.ceil((86400000 - (now - stats.lastResetDay)) / 1000)
		);

		return {
			minutes: Math.ceil(minutesRemaining / 60),
			days: Math.ceil(daysRemaining / 86400)
		};
	}

	/**
	 * Check if any model in chain is available
	 */
	hasAvailableModel(chain: ModelConfig[], estimatedTokens: number): boolean {
		return chain.some((config) => this.canUseModel(config.model, estimatedTokens));
	}

	/**
	 * Get summary of current usage
	 */
	getSummary(): {
		totalRequests: number;
		totalTokens: number;
		availableModels: number;
		limitedModels: number;
	} {
		let totalRequests = 0;
		let totalTokens = 0;
		let availableModels = 0;
		let limitedModels = 0;

		for (const [model, stats] of this.usage.entries()) {
			this.resetIfNeeded(model);

			totalRequests += stats.requestsToday;
			totalTokens += stats.tokensToday;

			if (this.canUseModel(model, 1000)) {
				availableModels++;
			} else {
				limitedModels++;
			}
		}

		return {
			totalRequests,
			totalTokens,
			availableModels,
			limitedModels
		};
	}
}

/**
 * Singleton instance for global usage tracking
 */
let globalTracker: UsageTracker | null = null;

/**
 * Get or create the global usage tracker
 */
export function getUsageTracker(): UsageTracker {
	if (!globalTracker) {
		globalTracker = new UsageTracker();
	}
	return globalTracker;
}

/**
 * Reset the global usage tracker (mainly for testing)
 */
export function resetGlobalTracker(): void {
	if (globalTracker) {
		globalTracker.resetAll();
	}
	globalTracker = null;
}

