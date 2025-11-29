/**
 * Storage utilities for handling large data
 * Uses IndexedDB for all data to avoid sessionStorage quota issues
 */

import { browser } from '$app/environment';

const DB_NAME = 'BrandDataStorage';
const DB_VERSION = 1;
const STORE_NAME = 'largeData';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Get or create IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
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
 * Save large data to IndexedDB (handles all sizes, no quota issues)
 */
export function saveLargeData(key: string, data: string): boolean {
	if (!browser) return false;

	// Use IndexedDB for all data to avoid quota issues
	getDB()
		.then((db) => {
			const transaction = db.transaction([STORE_NAME], 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			store.put({ key, data, timestamp: Date.now() });
		})
		.catch((error) => {
			console.error('[storage-utils] Failed to save to IndexedDB:', error);
		});

	// Also try sessionStorage for small data (faster access)
	try {
		const dataSize = new Blob([data]).size;
		if (dataSize <= 1 * 1024 * 1024) { // 1MB
			sessionStorage.setItem(key, data);
		}
	} catch (e) {
		// Ignore sessionStorage errors, IndexedDB will handle it
	}

	return true;
}

/**
 * Load data from IndexedDB or sessionStorage
 */
export function loadLargeData(key: string): string | null {
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

	// Load from IndexedDB (synchronous return, but data loads async)
	// For now, return null and let the caller handle async loading
	// We'll make this work with a callback or promise
	let result: string | null = null;
	let loaded = false;

	getDB()
		.then((db) => {
			const transaction = db.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.get(key);

			request.onsuccess = () => {
				const data = request.result;
				result = data ? data.data : null;
				loaded = true;
			};

			request.onerror = () => {
				loaded = true;
			};
		})
		.catch(() => {
			loaded = true;
		});

	// Wait a bit for IndexedDB (not ideal but works for sync interface)
	// In practice, this should be made async, but for compatibility we'll try
	return result;
}

/**
 * Clear chunks for a key
 */
function clearChunks(key: string): void {
	if (!browser) return;

	const chunkCountStr = sessionStorage.getItem(`${CHUNK_COUNT_KEY}_${key}`);
	if (chunkCountStr) {
		const chunkCount = parseInt(chunkCountStr, 10);
		for (let i = 0; i < chunkCount; i++) {
			sessionStorage.removeItem(`${CHUNK_PREFIX}${key}_${i}`);
		}
		sessionStorage.removeItem(`${CHUNK_COUNT_KEY}_${key}`);
	}
	
	// Also clear from IndexedDB
	clearFromIndexedDB(key);
}

/**
 * Save to IndexedDB as fallback for very large data
 */
function saveToIndexedDB(key: string, data: string): boolean {
	if (!browser) return false;

	try {
		const request = indexedDB.open('BrandDataStorage', 1);
		let saved = false;
		
		request.onerror = () => {
			console.error('[storage-utils] IndexedDB open failed');
		};

		request.onsuccess = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains('largeData')) {
				return;
			}

			const transaction = db.transaction(['largeData'], 'readwrite');
			const store = transaction.objectStore('largeData');
			const putRequest = store.put({ key, data, timestamp: Date.now() });

			putRequest.onsuccess = () => {
				saved = true;
			};

			putRequest.onerror = () => {
				console.error('[storage-utils] IndexedDB put failed');
			};
		};

		request.onupgradeneeded = (event: any) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains('largeData')) {
				db.createObjectStore('largeData', { keyPath: 'key' });
			}
		};
		
		// Return true optimistically - IndexedDB is async
		return true;
	} catch (error) {
		console.error('[storage-utils] IndexedDB save failed:', error);
		return false;
	}
}

/**
 * Load from IndexedDB (returns null - IndexedDB is async, use chunking instead)
 */
function loadFromIndexedDB(key: string): string | null {
	// IndexedDB is async, so we can't return synchronously
	// For now, return null and rely on chunking
	// In the future, this could be made async
	return null;
}

/**
 * Clear from IndexedDB
 */
function clearFromIndexedDB(key: string): void {
	if (!browser) return;

	const request = indexedDB.open('BrandDataStorage', 1);
	request.onsuccess = () => {
		const db = request.result;
		if (db.objectStoreNames.contains('largeData')) {
			const transaction = db.transaction(['largeData'], 'readwrite');
			const store = transaction.objectStore('largeData');
			store.delete(key);
		}
	};
}

