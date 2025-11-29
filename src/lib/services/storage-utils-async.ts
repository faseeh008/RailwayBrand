/**
 * Async storage utilities for IndexedDB
 * Use this for proper async loading of large data
 */

import { browser } from '$app/environment';

const DB_NAME = 'BrandDataStorage';
const DB_VERSION = 1;
const STORE_NAME = 'largeData';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Get or create IndexedDB database
 */
export function getDB(): Promise<IDBDatabase> {
	if (dbPromise) return dbPromise;

	dbPromise = new Promise((resolve, reject) => {
		if (!browser) {
			reject(new Error('Not in browser'));
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event: any) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'key' });
			}
		};
	});

	return dbPromise;
}

/**
 * Save large data to IndexedDB (async)
 */
export async function saveLargeDataAsync(key: string, data: string): Promise<boolean> {
	if (!browser) return false;

	try {
		const db = await getDB();
		const transaction = db.transaction([STORE_NAME], 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		await new Promise<void>((resolve, reject) => {
			const request = store.put({ key, data, timestamp: Date.now() });
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});

		// Also save to sessionStorage for small data (faster access)
		try {
			const dataSize = new Blob([data]).size;
			if (dataSize <= 1 * 1024 * 1024) { // 1MB
				sessionStorage.setItem(key, data);
			}
		} catch (e) {
			// Ignore sessionStorage errors
		}

		return true;
	} catch (error) {
		console.error('[storage-utils-async] Failed to save:', error);
		return false;
	}
}

/**
 * Load data from IndexedDB (async)
 */
export async function loadLargeDataAsync(key: string): Promise<string | null> {
	if (!browser) return null;

	// Try sessionStorage first (faster for small data)
	try {
		const sessionData = sessionStorage.getItem(key);
		if (sessionData) {
			return sessionData;
		}
	} catch (e) {
		// Ignore
	}

	try {
		const db = await getDB();
		const transaction = db.transaction([STORE_NAME], 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const data = await new Promise<any>((resolve, reject) => {
			const request = store.get(key);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});

		return data ? data.data : null;
	} catch (error) {
		console.error('[storage-utils-async] Failed to load:', error);
		return null;
	}
}

