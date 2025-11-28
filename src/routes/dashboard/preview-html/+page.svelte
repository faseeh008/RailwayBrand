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

function migrateLegacyPreviewData(): Omit<TempBrandData, 'timestamp'> | null {
	if (typeof sessionStorage === 'undefined') {
		return null;
	}

	const legacyRaw = sessionStorage.getItem('preview_brand_data');
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
		
		let stored = loadTempBrandData();
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
			const migrated = migrateLegacyPreviewData();
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
					saveTempBrandData(migrated);
					stored = loadTempBrandData();
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
				// Fallback: try to get from legacy preview_brand_data
				const legacyRaw = typeof sessionStorage !== 'undefined' 
					? sessionStorage.getItem('preview_brand_data') 
					: null;
				
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
						
						// Fallback to legacy data if available
						if (stepHistory.length === 0) {
							const legacyRaw = typeof sessionStorage !== 'undefined' 
								? sessionStorage.getItem('preview_brand_data') 
								: null;
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

						// Get logo from brandLogos table
						if (result.logo) {
							brandDataFromDb.logoUrl = result.logo;
							brandDataFromDb.logo_url = result.logo;
							brandDataFromDb.logoFiles = [{ fileData: result.logo }];
							brandDataFromDb.logo = {
								primaryLogoUrl: result.logo,
								primary: result.logo
							};
						}

						// Try to get userInput from legacy data if available
						let userInput: any = {};
						const legacyRaw = typeof sessionStorage !== 'undefined' 
							? sessionStorage.getItem('preview_brand_data') 
							: null;
						if (legacyRaw) {
							try {
								const legacyData = JSON.parse(legacyRaw);
								userInput = legacyData.brandInput || {};
							} catch (e) {
								// Ignore
							}
						}

						// Save to temp storage
						saveTempBrandData({
							userInput: userInput,
							selectedTheme: inferThemeFromMood(guideline.mood || ''),
							brandData: brandDataFromDb,
							slides: []
						});
						stored = loadTempBrandData();
						console.log('[preview-html] ✅ Loaded brand data from database and saved to temp storage:', {
							hasStored: !!stored,
							guidelineId: stored?.brandData?.guidelineId,
							brandName: stored?.brandData?.brandName
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

									if (fullResult.logo) {
										brandDataFromDb.logoUrl = fullResult.logo;
										brandDataFromDb.logo_url = fullResult.logo;
										brandDataFromDb.logoFiles = [{ fileData: fullResult.logo }];
										brandDataFromDb.logo = {
											primaryLogoUrl: fullResult.logo,
											primary: fullResult.logo
										};
									}

									saveTempBrandData({
										userInput: {},
										selectedTheme: inferThemeFromMood(guideline.mood || ''),
										brandData: brandDataFromDb,
										slides: []
									});
									stored = loadTempBrandData();
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

		// Always fetch fresh slides from database to ensure correct logo per slide
		if (brandData?.guidelineId) {
			const fetchedSlides = await fetchSlidesFromDatabase(brandData.guidelineId);
			if (fetchedSlides.length) {
				// Update slides with fresh data from database (includes correct logos)
				slides = fetchedSlides;
				saveTempBrandData({
					userInput: stored.userInput,
					selectedTheme: stored.selectedTheme,
					brandData: stored.brandData,
					slides: fetchedSlides,
					buildData: stored.buildData
				});
			}
		}

		// Fetch logo from database if missing - prioritize logo from first slide if available
		if ((!brandData?.logoUrl && !brandData?.logo_url && !brandData?.logoFiles?.[0]?.fileData) && brandData?.guidelineId) {
			// First try to get logo from slides (each slide has its own logo now)
			const slideLogo = slides.find(s => s.logo)?.logo;
			if (slideLogo) {
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
				saveTempBrandData({
					userInput: stored.userInput,
					selectedTheme: stored.selectedTheme,
					brandData,
					slides: slides,
					buildData: stored.buildData
				});
			} else {
				// Fallback to fetching from brand guidelines
				const fetchedLogo = await fetchLogoFromDatabase(brandData.guidelineId);
				if (fetchedLogo) {
					brandData = { ...brandData, ...fetchedLogo };
					saveTempBrandData({
						userInput: stored.userInput,
						selectedTheme: stored.selectedTheme,
						brandData,
						slides: slides,
						buildData: stored.buildData
					});
				}
			}
		}

		if (stored.buildData?.html) {
			mockPageBuild = stored.buildData as MockBuildResult;
			webpageBuildComplete = true;
			setMockPageBlob(mockPageBuild.html);
		} else if (brandData?.guidelineId || brandData?.brandName || brandData?.brand_name) {
			await fetchMockPageFromDatabase(
				brandData?.guidelineId,
				brandData?.brandName || brandData?.brand_name
			);
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
		buildStepMessage = 'Gathering data from slides and chat...';

		try {
			// Stage 1: small delay while we \"gather\" data
			await sleep(3000);

		const theme = previewTheme || inferThemeFromBrandData(brandData);
		previewTheme = theme;

			buildStepMessage = 'Fetching images and logos...';

			const buildPromise = buildMockWebpage(brandData, theme, slides);

			// Give the API some breathing room while we show progress
			await sleep(3000);
			buildStepMessage = 'Applying styles and building UI...';

			const buildResult = await buildPromise;

			await sleep(3000);
			buildStepMessage = 'Finalizing preview...';

			mockPageBuild = buildResult;
			setMockPageBlob(buildResult.html);
			webpageBuildComplete = true;

			// Persist build data so user can revisit without rebuilding immediately
			updateBuildData({
				...buildResult,
				generatedAt: Date.now()
			});
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

			// First priority: Get logo from brandLogos table (new table)
			if (result.logo) {
				logoData.logoUrl = result.logo;
				logoData.logo_url = result.logo;
				logoData.logoFiles = [{ fileData: result.logo }];
				logoData.logo = {
					primaryLogoUrl: result.logo,
					primary: result.logo
				};
				return logoData;
			}

			// Second priority: Try to get logo from logoFiles (new format)
			if (guideline.logoFiles) {
				try {
					const logoFiles = JSON.parse(guideline.logoFiles);
					if (Array.isArray(logoFiles) && logoFiles.length > 0) {
						const firstLogo = logoFiles[0];
						const logoUrl = firstLogo?.fileData || firstLogo?.data || firstLogo?.fileUrl || firstLogo?.filePath;
						
						if (logoUrl) {
							logoData.logoUrl = logoUrl;
							logoData.logo_url = logoUrl;
							logoData.logoFiles = logoFiles;
							logoData.logo = {
								primaryLogoUrl: logoUrl,
								primary: logoUrl
							};
							return logoData;
						}
					}
				} catch (error) {
					console.warn('Failed to parse logoFiles:', error);
				}
			}

			// Fallback to logoData (base64)
			if (guideline.logoData) {
				logoData.logoUrl = guideline.logoData;
				logoData.logo_url = guideline.logoData;
				logoData.logo = {
					primaryLogoUrl: guideline.logoData,
					primary: guideline.logoData
				};
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
	if (!guidelineId && !brandName) return;
	const params = new URLSearchParams();
	if (guidelineId) {
		params.set('brandGuidelinesId', guidelineId);
	} else if (brandName) {
		params.set('brandName', brandName);
	}

	try {
		const response = await fetch(`/api/mockpagebuilder?${params.toString()}`);
		if (!response.ok) {
			if (response.status === 404) return;
			throw new Error('Failed to fetch mock webpage');
		}

		const result = await response.json();
		if (result?.success && result.page?.htmlContent) {
			mockPageBuild = {
				theme: result.page.theme,
				html: result.page.htmlContent,
				brandConfig: result.page.brandConfig
			};
			setMockPageBlob(result.page.htmlContent);
			webpageBuildComplete = true;

			updateBuildData({
				...mockPageBuild,
				generatedAt: Date.now()
			});
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
	const params = new URLSearchParams();
	if (brandData?.guidelineId) {
		params.set('brandGuidelinesId', brandData.guidelineId);
	} else if (brandData?.brandName || brandData?.brand_name) {
		params.set('brandName', brandData?.brandName || brandData?.brand_name);
	}

	try {
		if ([...params.keys()].length) {
			await fetch(`/api/mockpagebuilder?${params.toString()}`, {
				method: 'DELETE'
			});
		}
	} catch (err) {
		console.error('Failed to delete mock webpage:', err);
	}

	webpageBuildComplete = false;
	mockPageBuild = null;
	buildStepMessage = '';

	if (mockPageBlobUrl) {
		URL.revokeObjectURL(mockPageBlobUrl);
		mockPageBlobUrl = null;
	}

	clearStoredBuildData();

	// Refresh UI state after deletion so the Visit button resets
	if (typeof window !== 'undefined') {
		window.location.reload();
	}
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
				/>
				{#if isBuildingMockWebpage || buildStepMessage}
					<p class="mt-2 text-sm text-muted-foreground text-center">
						{buildStepMessage}
					</p>
				{/if}
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