<script lang="ts">
	import { onMount } from 'svelte';
	import SlideManager from '$lib/components/SlideManager.svelte';
import {
	loadTempBrandData,
	saveTempBrandData,
	updateBuildData,
	clearTempBrandData
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
		let stored = loadTempBrandData();

		if (!stored) {
			const migrated = migrateLegacyPreviewData();
			if (migrated) {
				saveTempBrandData(migrated);
				stored = loadTempBrandData();
			}
		}

		if (!stored) {
			error = 'No brand data found. Please go through the builder first.';
			return;
		}
		brandData = stored.brandData;
		previewTheme = stored.selectedTheme || inferThemeFromBrandData(brandData);
		slides = stored.slides || [];

		if ((!slides || slides.length === 0) && brandData?.guidelineId) {
			const fetchedSlides = await fetchSlidesFromDatabase(brandData.guidelineId);
			if (fetchedSlides.length) {
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

		if (stored.buildData?.html) {
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
					html: slide.htmlContent || ''
				}))
				.filter((slide: { name: string; html: string }) => slide.html);
		}
	} catch (err) {
		console.error('Failed to fetch slides from database:', err);
	}
	return [];
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

	function handleDeleteMockWebpage() {
		webpageBuildComplete = false;
		mockPageBuild = null;
		buildStepMessage = '';

		if (mockPageBlobUrl) {
			URL.revokeObjectURL(mockPageBlobUrl);
			mockPageBlobUrl = null;
		}

		clearTempBrandData();
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
					{slides}
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


