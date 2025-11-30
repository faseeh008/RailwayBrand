<script lang="ts">
	import { onMount } from 'svelte';
	import SlideManager from '$lib/components/SlideManager.svelte';
import {
	loadTempBrandData,
	saveTempBrandData,
	updateBuildData,
	clearTempBrandData,
	clearStoredBuildData
} from '$lib/services/temp-brand-storage';
import type { TempBrandData } from '$lib/services/temp-brand-storage';
import {
	type PreviewTheme,
	inferThemeFromBrandData,
	inferThemeFromMood
} from '$lib/utils/theme-utils';
	import {
		buildMockWebpage,
		type BuildResult as MockBuildResult
	} from '$lib/services/mock-webpage-builder';

let slides: Array<{ name: string; html: string }> = [];
	let brandData: any = null;
	let loading = true;
	let error: string | null = null;

	let isBuildingMockWebpage = false;
	let webpageBuildComplete = false;
	let mockPageBuild: MockBuildResult | null = null;
	let mockPageBlobUrl: string | null = null;

let buildStepMessage = '';
let previewTheme: PreviewTheme = 'Minimalistic';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function migrateLegacyPreviewData(): Promise<Omit<TempBrandData, 'timestamp'> | null> {
	if (typeof sessionStorage === 'undefined') {
		return null;
	}

	// Load legacy data from IndexedDB or sessionStorage
	let legacyRaw: string | null = null;
	try {
		// Try IndexedDB first (for large data)
		const { loadLargeDataAsync } = await import('$lib/services/storage-utils-async');
		legacyRaw = await loadLargeDataAsync('preview_brand_data');
	} catch (e) {
		// Fallback to sessionStorage
	}
	if (!legacyRaw) {
		legacyRaw = sessionStorage.getItem('preview_brand_data');
	}
	if (!legacyRaw) {
		return null;
	}

	try {
		const legacyData = JSON.parse(legacyRaw);
		if (!legacyData || typeof legacyData !== 'object') {
			return null;
		}

		const userInput = legacyData.brandInput || {};
		const selectedTheme = inferThemeFromMood(legacyData.selectedMood);

		let logoFiles: Array<any> = [];
		try {
			const legacyLogoFilesRaw =
				legacyData.logoFiles || legacyData.logo_files || legacyData.logo?.files || [];
			if (Array.isArray(legacyLogoFilesRaw)) {
				logoFiles = legacyLogoFilesRaw;
			} else if (typeof legacyLogoFilesRaw === 'string') {
				logoFiles = JSON.parse(legacyLogoFilesRaw);
			}
		} catch (logoParseError) {
			console.warn('[preview-html] Failed to parse legacy logo files:', logoParseError);
		}

		const primaryLogoData =
			logoFiles[0]?.fileData || logoFiles[0]?.data || legacyData.logoData || null;

		const brandDataPayload = {
			...(legacyData.completeGuidelines || {}),
			brandName: legacyData.brandName || legacyData.brand_name,
			brand_name: legacyData.brand_name || legacyData.brandName,
			brandDomain: legacyData.brandDomain || legacyData.brand_domain,
			brand_domain: legacyData.brand_domain || legacyData.brandDomain,
			shortDescription: legacyData.shortDescription || legacyData.short_description,
			short_description: legacyData.short_description || legacyData.shortDescription,
			stepHistory: legacyData.stepHistory || [],
			guidelineId: legacyData.guidelineId,
			brandInput: userInput,
			logoFiles,
			logoData: primaryLogoData,
			logo:
				legacyData.logo ||
				(primaryLogoData
					? {
							primaryLogoUrl: primaryLogoData,
							primary: primaryLogoData
					  }
					: legacyData.logo)
		};

		return {
			userInput,
			selectedTheme,
			brandData: brandDataPayload,
		slides: legacyData.slides || [],
			buildData: undefined
		};
	} catch (err) {
		console.error('[preview-html] Failed to migrate legacy preview data:', err);
		return null;
	}
}

onMount(async () => {
	try {
		console.log('[preview-html] onMount started');
		
		// Check if we have a specific guidelineId from sessionStorage (from My Brands preview)
		const currentGuidelineId = typeof sessionStorage !== 'undefined' 
			? sessionStorage.getItem('current_guideline_id') 
			: null;
		
		console.log('[preview-html] currentGuidelineId from sessionStorage:', currentGuidelineId);
		
		let stored = await loadTempBrandData();
		console.log('[preview-html] Loaded temp brand data:', {
			hasStored: !!stored,
			hasBrandData: !!stored?.brandData,
			guidelineId: stored?.brandData?.guidelineId,
			brandName: stored?.brandData?.brandName
		});

		// Only clear cache if we have a specific guidelineId from My Brands AND it doesn't match
		// If coming from builder (no currentGuidelineId), use stored data as-is
		if (stored && currentGuidelineId) {
			// Only verify match if we're coming from My Brands (currentGuidelineId is set)
			if (stored.brandData?.guidelineId && stored.brandData.guidelineId !== currentGuidelineId) {
				// Clear cached data if it doesn't match the requested brand
				console.log('[preview-html] Clearing cached data - brand mismatch:', {
					cached: stored.brandData?.guidelineId,
					requested: currentGuidelineId
				});
				clearTempBrandData();
				stored = null;
			}
		}

		if (!stored) {
			console.log('[preview-html] No stored data, trying to migrate legacy data');
			const migrated = await migrateLegacyPreviewData();
			console.log('[preview-html] Migrated legacy data:', {
				hasMigrated: !!migrated,
				guidelineId: migrated?.brandData?.guidelineId,
				brandName: migrated?.brandData?.brandName
			});
			if (migrated) {
				// Only verify match if we have a specific guidelineId from My Brands
				if (currentGuidelineId && migrated.brandData?.guidelineId && migrated.brandData.guidelineId !== currentGuidelineId) {
					console.log('[preview-html] Migrated data does not match requested brand, clearing cache');
					clearTempBrandData();
					// Clear legacy sessionStorage too
					if (typeof sessionStorage !== 'undefined') {
						sessionStorage.removeItem('preview_brand_data');
					}
				} else {
					await saveTempBrandData(migrated);
					stored = await loadTempBrandData();
					console.log('[preview-html] Saved migrated data, reloaded:', {
						hasStored: !!stored,
						guidelineId: stored?.brandData?.guidelineId
					});
				}
			}
		}

		// If still no stored data, try to load from database
		// Priority: 1) currentGuidelineId (from My Brands), 2) legacy preview_brand_data
		if (!stored) {
			console.log('[preview-html] Still no stored data, trying to load from database');
			
			let guidelineIdToFetch: string | null = null;
			
			// First priority: use currentGuidelineId if set (from My Brands page)
			if (currentGuidelineId) {
				guidelineIdToFetch = currentGuidelineId;
				console.log('[preview-html] Using currentGuidelineId from sessionStorage:', guidelineIdToFetch);
			} else {
				// Fallback: try to get from legacy preview_brand_data (from IndexedDB)
				let legacyRaw: string | null = null;
				if (typeof window !== 'undefined') {
					try {
						const { loadLargeDataAsync } = await import('$lib/services/storage-utils-async');
						legacyRaw = await loadLargeDataAsync('preview_brand_data');
					} catch (e) {
						// Fallback to sessionStorage
					}
					if (!legacyRaw) {
						legacyRaw = sessionStorage.getItem('preview_brand_data');
					}
				}
				
				console.log('[preview-html] Legacy preview_brand_data from sessionStorage:', {
					hasLegacyRaw: !!legacyRaw,
					preview: legacyRaw?.substring(0, 200)
				});
				
				if (legacyRaw) {
					try {
						const legacyData = JSON.parse(legacyRaw);
						console.log('[preview-html] Parsed legacy data:', {
							hasGuidelineId: !!legacyData.guidelineId,
							guidelineId: legacyData.guidelineId,
							brandName: legacyData.brandName
						});
						if (legacyData.guidelineId) {
							guidelineIdToFetch = legacyData.guidelineId;
						}
					} catch (e) {
						console.warn('[preview-html] Failed to parse legacy data:', e);
					}
				}
			}
			
			if (guidelineIdToFetch) {
				console.log('[preview-html] Fetching brand guidelines from API with ID:', {
					id: guidelineIdToFetch,
					idType: typeof guidelineIdToFetch,
					idLength: guidelineIdToFetch?.length,
					url: `/api/brand-guidelines/${guidelineIdToFetch}`
				});
				// Try to fetch brand data from database
				let response = await fetch(`/api/brand-guidelines/${guidelineIdToFetch}`);
				console.log('[preview-html] API response status:', response.status);
				
				// If specific ID not found, fallback to most recent guideline
				if (!response.ok && response.status === 404) {
					console.warn('[preview-html] Specific guideline not found, fetching most recent guideline');
					response = await fetch('/api/brand-guidelines?limit=1');
					if (response.ok) {
						const recentResult = await response.json();
						if (recentResult.success && recentResult.guidelines && recentResult.guidelines.length > 0) {
							console.log('[preview-html] Using most recent guideline:', recentResult.guidelines[0].id);
							guidelineIdToFetch = recentResult.guidelines[0].id;
							// Retry with the most recent ID
							response = await fetch(`/api/brand-guidelines/${guidelineIdToFetch}`);
						}
					}
				}
				
				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					console.error('[preview-html] API error response:', {
						status: response.status,
						error: errorData
					});
				}
				if (response.ok) {
					const result = await response.json();
					console.log('[preview-html] API response result:', {
						success: result.success,
						hasGuideline: !!result.guideline,
						guidelineId: result.guideline?.id
					});
					if (result.success && result.guideline) {
						const guideline = result.guideline;
						
						// Try to get stepHistory from structuredData or legacy data
						let stepHistory: any[] = [];
						try {
							if (guideline.structuredData) {
								const structuredData = typeof guideline.structuredData === 'string' 
									? JSON.parse(guideline.structuredData) 
									: guideline.structuredData;
								stepHistory = structuredData?.stepHistory || [];
							}
						} catch (e) {
							console.warn('[preview-html] Failed to parse structuredData for stepHistory:', e);
						}
						
						// Fallback to legacy data if available (from IndexedDB)
						if (stepHistory.length === 0) {
							let legacyRaw: string | null = null;
							if (typeof window !== 'undefined') {
								try {
									const { loadLargeDataAsync } = await import('$lib/services/storage-utils-async');
									legacyRaw = await loadLargeDataAsync('preview_brand_data');
								} catch (e) {
									// Fallback to sessionStorage
								}
								if (!legacyRaw) {
									legacyRaw = sessionStorage.getItem('preview_brand_data');
								}
							}
							if (legacyRaw) {
								try {
									const legacyData = JSON.parse(legacyRaw);
									stepHistory = legacyData.stepHistory || [];
								} catch (e) {
									// Ignore
								}
							}
						}
						
						// Build brandData from guideline
						const brandDataFromDb: any = {
							brandName: guideline.brandName,
							brand_name: guideline.brandName,
							brandDomain: guideline.brandDomain || guideline.industry || '',
							brand_domain: guideline.brandDomain || guideline.industry || '',
							shortDescription: guideline.shortDescription || '',
							short_description: guideline.shortDescription || '',
							selectedMood: guideline.mood || '',
							selectedAudience: guideline.audience || '',
							guidelineId: guideline.id,
							stepHistory: stepHistory
						};

								// Parse structuredData to get additional fields
						try {
							if (guideline.structuredData) {
								const structuredData = typeof guideline.structuredData === 'string' 
									? JSON.parse(guideline.structuredData) 
									: guideline.structuredData;
								// Merge structured data into brandDataFromDb
								Object.assign(brandDataFromDb, structuredData);
							}
						} catch (e) {
							console.warn('[preview-html] Failed to parse structuredData:', e);
						}

						// Parse JSON fields
						if (guideline.logoFiles) {
							try {
								brandDataFromDb.logoFiles = typeof guideline.logoFiles === 'string' 
									? JSON.parse(guideline.logoFiles) 
									: guideline.logoFiles;
							} catch (e) {
								brandDataFromDb.logoFiles = [];
							}
						}

						// Store FULL logo with all base64 data - no sanitization, no quota worries
						if (result.logo) {
							brandDataFromDb.logoUrl = result.logo;
							brandDataFromDb.logo_url = result.logo;
							brandDataFromDb.logoFiles = [{ fileData: result.logo }];
							brandDataFromDb.logo = {
								primaryLogoUrl: result.logo,
								primary: result.logo
							};
						}

						// Try to get userInput from legacy data if available (from IndexedDB)
						let userInput: any = {};
						let legacyRaw: string | null = null;
						if (typeof window !== 'undefined') {
							try {
								const { loadLargeDataAsync } = await import('$lib/services/storage-utils-async');
								legacyRaw = await loadLargeDataAsync('preview_brand_data');
							} catch (e) {
								// Fallback to sessionStorage
							}
							if (!legacyRaw) {
								legacyRaw = sessionStorage.getItem('preview_brand_data');
							}
						}
						if (legacyRaw) {
							try {
								const legacyData = JSON.parse(legacyRaw);
								userInput = legacyData.brandInput || {};
							} catch (e) {
								// Ignore
							}
						}

						// Save FULL data including large base64 logos - no sanitization
						await saveTempBrandData({
							userInput: userInput,
							selectedTheme: inferThemeFromMood(guideline.mood || ''),
							brandData: brandDataFromDb, // Save with FULL logo data
							slides: []
						});
						stored = await loadTempBrandData();
						console.log('[preview-html] ✅ Loaded brand data from database and saved to temp storage:', {
							hasStored: !!stored,
							guidelineId: stored?.brandData?.guidelineId,
							brandName: stored?.brandData?.brandName,
							hasLogo: !!stored?.brandData?.logoUrl
						});
					} else {
						console.error('[preview-html] API returned success but no guideline data');
					}
				} else {
					console.error('[preview-html] Failed to fetch brand guidelines, status:', response.status);
				}
			} else {
				console.warn('[preview-html] No guidelineId available, fetching most recent guideline');
				// Fallback: Get the most recent guideline for the user
				try {
					const response = await fetch('/api/brand-guidelines?limit=1');
					if (response.ok) {
						const result = await response.json();
						if (result.success && result.guidelines && result.guidelines.length > 0) {
							const mostRecentGuideline = result.guidelines[0];
							console.log('[preview-html] Found most recent guideline:', mostRecentGuideline.id);
							
							// Fetch full guideline data
							const fullResponse = await fetch(`/api/brand-guidelines/${mostRecentGuideline.id}`);
							if (fullResponse.ok) {
								const fullResult = await fullResponse.json();
								if (fullResult.success && fullResult.guideline) {
									const guideline = fullResult.guideline;
									
									// Build brandData from guideline (same logic as above)
									let stepHistory: any[] = [];
									try {
										if (guideline.structuredData) {
											const structuredData = typeof guideline.structuredData === 'string' 
												? JSON.parse(guideline.structuredData) 
												: guideline.structuredData;
											stepHistory = structuredData?.stepHistory || [];
										}
									} catch (e) {
										console.warn('[preview-html] Failed to parse structuredData for stepHistory:', e);
									}
									
									const brandDataFromDb: any = {
										brandName: guideline.brandName,
										brand_name: guideline.brandName,
										brandDomain: guideline.brandDomain || guideline.industry || '',
										brand_domain: guideline.brandDomain || guideline.industry || '',
										shortDescription: guideline.shortDescription || '',
										short_description: guideline.shortDescription || '',
										selectedMood: guideline.mood || '',
										selectedAudience: guideline.audience || '',
										guidelineId: guideline.id,
										stepHistory: stepHistory
									};

									try {
										if (guideline.structuredData) {
											const structuredData = typeof guideline.structuredData === 'string' 
												? JSON.parse(guideline.structuredData) 
												: guideline.structuredData;
											Object.assign(brandDataFromDb, structuredData);
										}
									} catch (e) {
										console.warn('[preview-html] Failed to parse structuredData:', e);
									}

									if (guideline.logoFiles) {
										try {
											brandDataFromDb.logoFiles = typeof guideline.logoFiles === 'string' 
												? JSON.parse(guideline.logoFiles) 
												: guideline.logoFiles;
										} catch (e) {
											brandDataFromDb.logoFiles = [];
										}
									}

									// Store FULL logo with all base64 data - no sanitization
									if (fullResult.logo) {
										brandDataFromDb.logoUrl = fullResult.logo;
										brandDataFromDb.logo_url = fullResult.logo;
										brandDataFromDb.logoFiles = [{ fileData: fullResult.logo }];
										brandDataFromDb.logo = {
											primaryLogoUrl: fullResult.logo,
											primary: fullResult.logo
										};
									}

									// Save FULL data including large base64 logos - no sanitization
									await saveTempBrandData({
										userInput: {},
										selectedTheme: inferThemeFromMood(guideline.mood || ''),
										brandData: brandDataFromDb, // Save with FULL logo data
										slides: []
									});
									stored = await loadTempBrandData();
									console.log('[preview-html] ✅ Loaded most recent guideline from database:', {
										hasStored: !!stored,
										guidelineId: stored?.brandData?.guidelineId,
										brandName: stored?.brandData?.brandName
									});
								}
							}
						}
					}
				} catch (e) {
					console.error('[preview-html] Failed to fetch most recent guideline:', e);
				}
			}
		}

		if (!stored) {
			error = 'No brand data found. Please go through the builder first.';
			return;
		}
		brandData = stored.brandData;
		previewTheme = stored.selectedTheme || inferThemeFromBrandData(brandData);
		slides = stored.slides || [];
		
		// ALWAYS fetch fresh FULL logo from database - no quota worries
		if (brandData?.guidelineId) {
			console.log('[preview-html] Fetching fresh FULL logo from database');
			const fetchedLogo = await fetchLogoFromDatabase(brandData.guidelineId);
			if (fetchedLogo) {
				// Update brandData with FULL logo
				brandData = { ...brandData, ...fetchedLogo };
				// Save FULL logo to storage - no sanitization
				await saveTempBrandData({
					userInput: stored.userInput,
					selectedTheme: stored.selectedTheme,
					brandData: brandData, // Save with FULL logo
					slides: slides,
					buildData: stored.buildData
				});
				console.log('[preview-html] ✅ FULL logo fetched and saved:', {
					hasLogoUrl: !!brandData.logoUrl,
					hasLogoFiles: !!brandData.logoFiles?.[0],
					logoUrlLength: brandData.logoUrl?.length || 0,
					logoUrlPrefix: brandData.logoUrl?.substring(0, 50) || 'none',
					isDataUrl: brandData.logoUrl?.startsWith('data:') || false
				});
			} else {
				console.warn('[preview-html] ⚠️ No logo found in database');
			}
		}

		// Always fetch fresh slides from database to ensure correct logo per slide
		if (brandData?.guidelineId) {
			const fetchedSlides = await fetchSlidesFromDatabase(brandData.guidelineId);
			if (fetchedSlides.length) {
				// Update slides with fresh data from database (includes correct logos)
				slides = fetchedSlides;
				// Save FULL slides with all data - no truncation
				await saveTempBrandData({
					userInput: stored.userInput,
					selectedTheme: stored.selectedTheme,
					brandData: stored.brandData,
					slides: fetchedSlides, // Save FULL slides with all HTML and logos
					buildData: stored.buildData
				});
			}
		}

		// Fetch logo from database if missing - prioritize logo from first slide if available
		if ((!brandData?.logoUrl && !brandData?.logo_url && !brandData?.logoFiles?.[0]?.fileData) && brandData?.guidelineId) {
			// First try to get logo from slides (each slide has its own logo now)
			const slideLogo = slides.find(s => s.logo)?.logo;
			if (slideLogo) {
				// Store FULL logo - no sanitization
				brandData = { 
					...brandData, 
					logoUrl: slideLogo,
					logo_url: slideLogo,
					logoFiles: [{ fileData: slideLogo }],
					logo: {
						primaryLogoUrl: slideLogo,
						primary: slideLogo
					}
				};
				// Save FULL data including logo - no sanitization
				await saveTempBrandData({
					userInput: stored.userInput,
					selectedTheme: stored.selectedTheme,
					brandData: brandData, // Save with FULL logo
					slides: slides, // Save FULL slides
					buildData: stored.buildData
				});
			} else {
				// Fallback to fetching from brand guidelines
				const fetchedLogo = await fetchLogoFromDatabase(brandData.guidelineId);
				if (fetchedLogo) {
					// Store FULL logo - no sanitization
					brandData = { ...brandData, ...fetchedLogo };
					// Save FULL data including logo - no sanitization
					await saveTempBrandData({
						userInput: stored.userInput,
						selectedTheme: stored.selectedTheme,
						brandData: brandData, // Save with FULL logo
						slides: slides, // Save FULL slides
						buildData: stored.buildData
					});
				}
			}
		}

		// Priority 1: Try to load from database first (persistent storage)
		if (brandData?.guidelineId) {
			await fetchMockPageFromDatabase(brandData.guidelineId);
		}
		
		// Priority 2: Fallback to stored build data (temporary storage)
		if (!webpageBuildComplete && stored.buildData?.html) {
			mockPageBuild = stored.buildData as MockBuildResult;
			webpageBuildComplete = true;
			setMockPageBlob(mockPageBuild.html);
		}
	} catch (e: any) {
		error = e?.message || 'Failed to load preview data.';
	} finally {
		loading = false;
	}
});

	function setMockPageBlob(html: string) {
		if (mockPageBlobUrl) {
			URL.revokeObjectURL(mockPageBlobUrl);
		}
		mockPageBlobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
	}

	async function handleBuildMockWebpage() {
		if (!brandData || isBuildingMockWebpage) return;

		isBuildingMockWebpage = true;
		webpageBuildComplete = false;
		buildStepMessage = 'Extracting brand data...';

		try {
			// Step 1: Extract session data and store in sessionStorage
			if (!brandData?.guidelineId) {
				throw new Error('Brand guideline ID is required');
			}

			await sleep(3000);
			buildStepMessage = 'Creating session data...';

			// Fetch session data from API
			const sessionResponse = await fetch(`/api/brand-guidelines/${brandData.guidelineId}/extract-session-data`);
			if (!sessionResponse.ok) {
				throw new Error('Failed to extract session data');
			}

			const sessionResult = await sessionResponse.json();
			if (!sessionResult.success || !sessionResult.data) {
				throw new Error('Invalid session data');
			}

			// Store in sessionStorage
			if (typeof sessionStorage !== 'undefined') {
				sessionStorage.setItem('brand_session_data', JSON.stringify(sessionResult.data));
				console.log('[handleBuildMockWebpage] Session data stored:', sessionResult.data);
			}

			await sleep(3000);
			buildStepMessage = 'Building mock webpage...';

			// Step 2: Determine vibe from brand data
			const vibe = brandData.mood || brandData.selectedMood || previewTheme || inferThemeFromBrandData(brandData);
			const normalizedVibe = (vibe === 'Minimalistic' || vibe === 'Maximalistic' || 
				vibe === 'Funky' || vibe === 'Futuristic') 
				? vibe 
				: 'Minimalistic';

			// Step 3: Call build API with new mock-page-builder system
			const buildResponse = await fetch('/api/build-mock-page', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					guidelineId: brandData.guidelineId,
					vibe: normalizedVibe // Pass the determined vibe
				})
			});

			if (!buildResponse.ok) {
				const errorData = await buildResponse.json().catch(() => ({}));
				throw new Error(errorData.error || 'Failed to build mock webpage');
			}

			const buildResult = await buildResponse.json();
			if (!buildResult.success || !buildResult.html) {
				throw new Error('Invalid build result');
			}

			await sleep(3000);
			buildStepMessage = 'Finalizing preview...';

			// Step 4: Set the mock page build result
			mockPageBuild = {
				theme: normalizedVibe,
				html: buildResult.html,
				brandConfig: sessionResult.data
			};

			setMockPageBlob(buildResult.html);
			webpageBuildComplete = true;

			// Persist build data
			await updateBuildData({
				...mockPageBuild,
				generatedAt: Date.now()
			});

			console.log('[handleBuildMockWebpage] Mock webpage built successfully');
		} catch (err: any) {
			console.error('Failed to build mock webpage:', err);
			error = err?.message || 'Failed to build mock webpage.';
			webpageBuildComplete = false;
		} finally {
			isBuildingMockWebpage = false;
			// Clear message a bit after completion/failure
			await sleep(500);
			buildStepMessage = '';
		}
	}

async function fetchSlidesFromDatabase(guidelineId: string) {
	try {
		const response = await fetch(`/api/history-slides?brandGuidelinesId=${guidelineId}`);
		if (!response.ok) {
			throw new Error('Failed to fetch slides from database');
		}
		const result = await response.json();
		if (result?.success && Array.isArray(result.slides)) {
			return result.slides
				.map((slide: any) => ({
					name: slide.slideTitle || slide.brandName || `Slide ${slide.slideNumber || ''}`.trim(),
					html: slide.htmlContent || '',
					logo: slide.logo || null // Include logo from each slide
				}))
				.filter((slide: { name: string; html: string }) => slide.html);
		}
	} catch (err) {
		console.error('Failed to fetch slides from database:', err);
	}
	return [];
}

async function fetchLogoFromDatabase(guidelineId: string) {
	try {
		const response = await fetch(`/api/brand-guidelines/${guidelineId}`);
		if (!response.ok) {
			console.warn('Failed to fetch brand guideline for logo:', response.statusText);
			return null;
		}
		const result = await response.json();
		if (result?.success && result?.guideline) {
			const guideline = result.guideline;
			const logoData: any = {};

			// First priority: Get logo from brandGuidelines table (from API response)
			if (result.logo) {
				// Ensure logo is a valid base64 data URL
				let logoUrl = result.logo;
				// If it's base64 but missing data URL prefix, add it
				if (logoUrl && !logoUrl.startsWith('data:')) {
					// Check if it's SVG (common case)
					if (logoUrl.includes('<svg') || logoUrl.trim().startsWith('<')) {
						logoUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(logoUrl)));
					} else {
						// Assume it's already base64, add generic image prefix
						logoUrl = 'data:image/png;base64,' + logoUrl;
					}
				}
				
				logoData.logoUrl = logoUrl;
				logoData.logo_url = logoUrl;
				logoData.logoFiles = [{ fileData: logoUrl }];
				logoData.logo = {
					primaryLogoUrl: logoUrl,
					primary: logoUrl
				};
				console.log('[preview-html] ✅ Logo fetched from API result.logo:', {
					length: logoUrl.length,
					prefix: logoUrl.substring(0, 50),
					isDataUrl: logoUrl.startsWith('data:')
				});
				return logoData;
			}

			// Second priority: Try to get logo from logoFiles (new format)
			if (guideline.logoFiles) {
				try {
					const logoFiles = typeof guideline.logoFiles === 'string' 
						? JSON.parse(guideline.logoFiles) 
						: guideline.logoFiles;
					if (Array.isArray(logoFiles) && logoFiles.length > 0) {
						const firstLogo = logoFiles[0];
						let logoUrl = firstLogo?.fileData || firstLogo?.data || firstLogo?.fileUrl || firstLogo?.filePath;
						
						// Ensure logo is a valid base64 data URL
						if (logoUrl && !logoUrl.startsWith('data:')) {
							if (logoUrl.includes('<svg') || logoUrl.trim().startsWith('<')) {
								logoUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(logoUrl)));
							} else {
								logoUrl = 'data:image/png;base64,' + logoUrl;
							}
						}
						
						if (logoUrl) {
							logoData.logoUrl = logoUrl;
							logoData.logo_url = logoUrl;
							logoData.logoFiles = logoFiles.map((logo: any) => ({
								...logo,
								fileData: logoUrl // Ensure all logos use the same format
							}));
							logoData.logo = {
								primaryLogoUrl: logoUrl,
								primary: logoUrl
							};
							console.log('[preview-html] ✅ Logo fetched from logoFiles:', {
								length: logoUrl.length,
								prefix: logoUrl.substring(0, 50),
								isDataUrl: logoUrl.startsWith('data:')
							});
							return logoData;
						}
					}
				} catch (error) {
					console.warn('Failed to parse logoFiles:', error);
				}
			}

			// Fallback to logoData (base64)
			if (guideline.logoData) {
				let logoUrl = guideline.logoData;
				// Ensure logo is a valid base64 data URL
				if (logoUrl && !logoUrl.startsWith('data:')) {
					if (logoUrl.includes('<svg') || logoUrl.trim().startsWith('<')) {
						logoUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(logoUrl)));
					} else {
						logoUrl = 'data:image/png;base64,' + logoUrl;
					}
				}
				logoData.logoUrl = logoUrl;
				logoData.logo_url = logoUrl;
				logoData.logo = {
					primaryLogoUrl: logoUrl,
					primary: logoUrl
				};
				console.log('[preview-html] ✅ Logo fetched from logoData:', {
					length: logoUrl.length,
					prefix: logoUrl.substring(0, 50),
					isDataUrl: logoUrl.startsWith('data:')
				});
				return logoData;
			}

			// Fallback to logoPath (legacy)
			if (guideline.logoPath) {
				logoData.logoUrl = guideline.logoPath;
				logoData.logo_url = guideline.logoPath;
				return logoData;
			}
		}
	} catch (err) {
		console.error('Failed to fetch logo from database:', err);
	}
	return null;
}

async function fetchMockPageFromDatabase(guidelineId?: string, brandName?: string) {
	if (!guidelineId) return;

	try {
		// Fetch from brand-guidelines table
		const response = await fetch(`/api/brand-guidelines/${guidelineId}`);
		if (!response.ok) {
			if (response.status === 404) {
				console.log('[fetchMockPageFromDatabase] Brand guideline not found');
				return;
			}
			throw new Error('Failed to fetch brand guideline');
		}

		const result = await response.json();
		if (result?.success && result?.guideline) {
			const guideline = result.guideline;
			
			// Check if mockPages exists in the guideline
			if (guideline.mockPages) {
				try {
					const mockPageData = typeof guideline.mockPages === 'string' 
						? JSON.parse(guideline.mockPages) 
						: guideline.mockPages;
					
					if (mockPageData?.html) {
						console.log('[fetchMockPageFromDatabase] Found saved mock page in database');
						mockPageBuild = {
							theme: mockPageData.vibe || 'Minimalistic',
							html: mockPageData.html,
							brandConfig: mockPageData.brandConfig || {}
						};
						setMockPageBlob(mockPageData.html);
						webpageBuildComplete = true;

						await updateBuildData({
							...mockPageBuild,
							generatedAt: Date.now()
						});
						
						console.log('[fetchMockPageFromDatabase] Mock page loaded from database successfully');
					}
				} catch (parseError) {
					console.warn('[fetchMockPageFromDatabase] Failed to parse mockPages:', parseError);
				}
			}
		}
	} catch (err) {
		console.error('Failed to fetch mock webpage from database:', err);
	}
}

	function handleVisitMockWebpage() {
		if (!webpageBuildComplete || !mockPageBlobUrl) {
			error = 'No mock webpage available. Please build one first.';
			return;
		}

		window.open(mockPageBlobUrl, '_blank', 'noopener,noreferrer');
	}

	function handleDownloadMockWebpage() {
		if (!mockPageBuild?.html) {
			error = 'No mock webpage available to download.';
			return;
		}

		const brandName = (brandData?.brand_name || brandData?.brandName || 'brand')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');

		const blob = new Blob([mockPageBuild.html], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${brandName}-${mockPageBuild.theme || 'mockpage'}.html`;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	}

async function handleDeleteMockWebpage() {
	if (!brandData?.guidelineId) {
		console.warn('[handleDeleteMockWebpage] No guidelineId found, cannot delete from database');
		return;
	}

	// Update state immediately for reactive UI update
	webpageBuildComplete = false;
	mockPageBuild = null;
	buildStepMessage = '';

	if (mockPageBlobUrl) {
		URL.revokeObjectURL(mockPageBlobUrl);
		mockPageBlobUrl = null;
	}

	// Clear stored build data
	await clearStoredBuildData();

	// Delete from database
	try {
		console.log('[handleDeleteMockWebpage] Deleting mock page from database...');
		const response = await fetch(`/api/brand-guidelines/${brandData.guidelineId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				mockPages: null // Set to null to delete
			})
		});

		if (response.ok) {
			console.log('[handleDeleteMockWebpage] Mock page deleted from database successfully');
		} else {
			console.warn('[handleDeleteMockWebpage] Failed to delete from database:', response.status);
		}
	} catch (err) {
		console.error('[handleDeleteMockWebpage] Error deleting from database:', err);
	}

	// State is already updated above, UI will reactively update
	console.log('[handleDeleteMockWebpage] Mock webpage deleted, state cleared');
}
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-background p-6">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"
			></div>
			<div class="text-muted-foreground">Loading preview...</div>
		</div>
	</div>
{:else if error}
	<div
		class="flex min-h-screen items-center justify-center bg-background p-6 text-center text-destructive"
	>
		<div>
			<div class="mb-4 text-2xl">⚠️</div>
			<div class="text-lg">{error}</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background px-4 pt-4 pb-10">
		<div class="mx-auto w-full space-y-6">
			{#if brandData}
				<SlideManager
					{brandData}
					onGoToBrands={() => {
						clearTempBrandData();
					}}
					onBuildMockWebpage={handleBuildMockWebpage}
					onVisitMockWebpage={handleVisitMockWebpage}
					onDownloadMockWebpage={handleDownloadMockWebpage}
					onDeleteMockWebpage={handleDeleteMockWebpage}
					isBuildingMockWebpage={isBuildingMockWebpage}
					hasMockWebpage={webpageBuildComplete}
					{buildStepMessage}
				/>
			{:else}
				<div
					class="rounded-xl border border-dashed border-amber-200 bg-white/70 p-8 text-center text-gray-500 shadow-sm"
				>
					No brand data found. Please complete the builder first.
				</div>
			{/if}
		</div>
	</div>
{/if}