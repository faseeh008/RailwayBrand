/**
 * Temporary Brand Storage Service
 * 
 * Manages temporary storage of brand data in sessionStorage for mock webpage generation.
 * Data is stored as JSON and includes user input, selected theme, brand data, and slides.
 */

import { browser } from '$app/environment';
import { saveLargeDataAsync, loadLargeDataAsync } from './storage-utils-async';

export interface TempBrandData {
	userInput: Record<string, any>;
	selectedTheme: 'Minimalistic' | 'Maximalistic' | 'Funky' | 'Futuristic';
	brandData: any;
	slides: Array<{ name: string; html: string }>;
	timestamp: number;
	buildData?: {
		theme: string;
		html: string;
		images: {
			hero: string | null;
			gallery: string[];
		};
		content: Record<string, any>;
		colors?: Record<string, string>;
		fontFamily?: string;
		generatedAt?: number;
	};
}

const STORAGE_KEY = 'temp_brand_data';
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save brand data to IndexedDB (no quota issues!)
 * No sanitization - save full data including large base64 logos
 */
export async function saveTempBrandData(data: Omit<TempBrandData, 'timestamp'>): Promise<boolean> {
	if (!browser) return false;

	try {
		const tempData: TempBrandData = {
			...data,
			timestamp: Date.now()
		};

		const jsonString = JSON.stringify(tempData);
		return await saveLargeDataAsync(STORAGE_KEY, jsonString);
	} catch (error: any) {
		console.error('Failed to save temp brand data:', error);
		return false;
	}
}

/**
 * Load brand data from IndexedDB (async)
 */
export async function loadTempBrandData(): Promise<TempBrandData | null> {
	if (!browser) return null;

	try {
		const stored = await loadLargeDataAsync(STORAGE_KEY);
		if (!stored) return null;

		const data: TempBrandData = JSON.parse(stored);

		// Check if data has expired
		if (Date.now() - data.timestamp > EXPIRY_TIME) {
			await clearTempBrandData();
			return null;
		}

		return data;
	} catch (error) {
		console.error('Failed to load temp brand data:', error);
		return null;
	}
}

/**
 * Update build data in stored brand data
 */
export async function updateBuildData(buildData: TempBrandData['buildData']): Promise<boolean> {
	if (!browser) return false;

	try {
		const existing = await loadTempBrandData();
		if (!existing) return false;

		existing.buildData = buildData;
		return await saveTempBrandData(existing);
	} catch (error) {
		console.error('Failed to update build data:', error);
		return false;
	}
}

/**
 * Clear temporary brand data (from IndexedDB and sessionStorage)
 */
export async function clearTempBrandData(): Promise<void> {
	if (!browser) return;
	
	// Clear sessionStorage
	sessionStorage.removeItem(STORAGE_KEY);
	
	// Clear from IndexedDB
	try {
		const { getDB } = await import('./storage-utils-async');
		const db = await getDB();
		const transaction = db.transaction(['largeData'], 'readwrite');
		const store = transaction.objectStore('largeData');
		await new Promise<void>((resolve, reject) => {
			const request = store.delete(STORAGE_KEY);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		console.error('Failed to clear from IndexedDB:', error);
	}
}

/**
 * Check if temp brand data exists and is valid
 */
export async function hasTempBrandData(): Promise<boolean> {
	if (!browser) return false;
	const data = await loadTempBrandData();
	return data !== null;
}

/**
 * Get selected theme from stored data
 */
export async function getSelectedTheme(): Promise<TempBrandData['selectedTheme'] | null> {
	const data = await loadTempBrandData();
	return data?.selectedTheme || null;
}

/**
 * Merge additional data into existing temp brand data
 */
export async function mergeTempBrandData(additionalData: Partial<TempBrandData>): Promise<boolean> {
	if (!browser) return false;

	try {
		const existing = await loadTempBrandData();
		if (!existing) {
			// If no existing data, create new entry
			const newData: Omit<TempBrandData, 'timestamp'> = {
				userInput: additionalData.userInput || {},
				selectedTheme: additionalData.selectedTheme || 'Minimalistic',
				brandData: additionalData.brandData || {},
				slides: additionalData.slides || [],
				buildData: additionalData.buildData
			};
			return await saveTempBrandData(newData);
		}

		// Merge with existing data
		const merged: Omit<TempBrandData, 'timestamp'> = {
			userInput: { ...existing.userInput, ...(additionalData.userInput || {}) },
			selectedTheme: additionalData.selectedTheme || existing.selectedTheme,
			brandData: { ...existing.brandData, ...(additionalData.brandData || {}) },
			slides: additionalData.slides || existing.slides,
			buildData: { ...existing.buildData, ...(additionalData.buildData || {}) }
		};

		return await saveTempBrandData(merged);
	} catch (error) {
		console.error('Failed to merge temp brand data:', error);
		return false;
	}
}

/**
 * Remove stored mock webpage build data but keep other cached fields intact
 */
export async function clearStoredBuildData(): Promise<boolean> {
	if (!browser) return false;

	const existing = await loadTempBrandData();
	if (!existing) return false;

	// Create a clean copy without buildData
	const { buildData, ...cleanData } = existing;
	
	// Save back without timestamp (saveTempBrandData will add a new one)
	const { timestamp, ...dataToSave } = cleanData;
	return await saveTempBrandData(dataToSave as Omit<TempBrandData, 'timestamp'>);
}

