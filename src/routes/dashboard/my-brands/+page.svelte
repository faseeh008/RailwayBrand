<script lang="ts">
	import { onMount } from 'svelte';
	import BrandCard from '$lib/components/BrandCard.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { goto } from '$app/navigation';
	import { Folder } from 'lucide-svelte';

	let brands: any[] = [];
	let loading = true;
	let error: string | null = null;

	async function loadBrands() {
		loading = true;
		error = null;
		try {
			const response = await fetch('/api/brand-guidelines');
			if (!response.ok) throw new Error('Failed to fetch brands');
			
			const result = await response.json();
			if (result.success) {
				brands = result.guidelines || [];
			} else {
				throw new Error(result.error || 'Failed to load brands');
			}
		} catch (err: any) {
			error = err.message || 'Failed to load brands';
			console.error('Error loading brands:', err);
		} finally {
			loading = false;
		}
	}

	async function handlePreviewBrand(brand: any) {
		try {
			const response = await fetch(`/api/brand-guidelines/${brand.id}`);
			if (!response.ok) throw new Error('Failed to fetch brand data');
			
			const result = await response.json();
			if (!result.success || !result.guideline) throw new Error('Brand not found');

			const guideline = result.guideline;
			
			// Transform to preview_brand_data format
			const previewData: any = {
				brandName: guideline.brandName,
				brand_name: guideline.brandName,
				brand_domain: guideline.brandDomain || guideline.industry || '',
				short_description: guideline.shortDescription || '',
				selectedMood: guideline.mood || '',
				selectedAudience: guideline.audience || '',
				brandValues: guideline.brandValues || '',
				customPrompt: guideline.customPrompt || '',
				guidelineId: guideline.id,
				id: guideline.id
			};

			let structuredData: any = null;
			if (guideline.structuredData) {
				try {
					structuredData =
						typeof guideline.structuredData === 'string'
							? JSON.parse(guideline.structuredData)
							: guideline.structuredData;
				} catch (e) {
					console.warn('⚠️ Failed to parse guideline.structuredData:', e);
				}
			}

			// Parse JSON fields
			if (guideline.logoFiles) {
				try {
					previewData.logoFiles = typeof guideline.logoFiles === 'string' 
						? JSON.parse(guideline.logoFiles) 
						: guideline.logoFiles;
				} catch (e) {
					previewData.logoFiles = [];
				}
			}

			if (guideline.contactInfo) {
				try {
					previewData.contact = typeof guideline.contactInfo === 'string'
						? JSON.parse(guideline.contactInfo)
						: guideline.contactInfo;
				} catch (e) {
					previewData.contact = {};
				}
			}

			// Always attempt to load stepHistory (even if structuredData is missing)
			previewData.stepHistory = [];
			if (guideline.stepHistory) {
				try {
					previewData.stepHistory =
						typeof guideline.stepHistory === 'string'
							? JSON.parse(guideline.stepHistory)
							: guideline.stepHistory;
				} catch (e) {
					console.warn('⚠️ Failed to parse guideline.stepHistory:', e);
				}
			} else if (structuredData?.stepHistory) {
				previewData.stepHistory = structuredData.stepHistory;
			}

			// Hydrate color palette so slides keep their saved colors
			if (guideline.colors) {
				try {
					const parsedColors =
						typeof guideline.colors === 'string'
							? JSON.parse(guideline.colors)
							: guideline.colors;
					if (parsedColors) {
						previewData.colors = parsedColors;
					}
				} catch (e) {
					console.warn('⚠️ Failed to parse guideline.colors:', e);
				}
			}
			if (!previewData.colors && structuredData?.colors) {
				previewData.colors = structuredData.colors;
			}
			if (!previewData.colorPalette && structuredData?.colorPalette) {
				previewData.colorPalette = structuredData.colorPalette;
			}
			if (!previewData.brandColors && structuredData?.brandColors) {
				previewData.brandColors = structuredData.brandColors;
			}

			// Store in sessionStorage
			sessionStorage.setItem('preview_brand_data', JSON.stringify(previewData));
			sessionStorage.setItem('preview_brand_saved', 'true');
			sessionStorage.setItem('current_guideline_id', guideline.id);

			// Navigate to preview page
			goto('/dashboard/preview-html');
		} catch (error) {
			console.error('Failed to preview brand:', error);
			alert('Failed to load brand preview. Please try again.');
		}
	}

	async function handleDeleteBrand(brand: any) {
		if (!confirm(`Are you sure you want to delete "${brand.brandName}"? This action cannot be undone.`)) {
			return;
		}

		try {
			const response = await fetch(`/api/brand-guidelines/${brand.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) throw new Error('Failed to delete brand');

			// Reload brands list
			await loadBrands();
		} catch (error) {
			console.error('Failed to delete brand:', error);
			alert('Failed to delete brand. Please try again.');
		}
	}

	onMount(() => {
		loadBrands();
	});
</script>

<div class="max-w-7xl">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-2">
			<Folder class="h-8 w-8 text-primary" />
			<h1 class="text-3xl font-bold text-foreground">My Brands</h1>
		</div>
		<p class="text-muted-foreground">View and manage your saved brand guidelines</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
				<p class="text-muted-foreground">Loading your brands...</p>
			</div>
		</div>
	{:else if error}
		<Card class="border-destructive/20 bg-destructive/5">
			<CardContent class="p-6">
				<p class="text-destructive">{error}</p>
				<button
					class="mt-4 rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
					onclick={loadBrands}
				>
					Try Again
				</button>
			</CardContent>
		</Card>
	{:else if brands.length === 0}
		<!-- Empty State -->
		<Card class="border-dashed">
			<CardContent class="flex flex-col items-center justify-center p-12 text-center">
				<Folder class="mb-4 h-16 w-16 text-muted-foreground" />
				<h3 class="mb-2 text-xl font-semibold text-foreground">No brands saved yet</h3>
				<p class="mb-6 max-w-md text-muted-foreground">
					Create your first brand guidelines using the Builder, then save it to My Brands to access it here.
				</p>
				<a
					href="/dashboard/builder"
					class="rounded bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
				>
					Create Brand Guidelines
				</a>
			</CardContent>
		</Card>
	{:else}
		<!-- Brands Grid -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each brands as brand}
				<BrandCard {brand} onPreview={handlePreviewBrand} onDelete={handleDeleteBrand} />
			{/each}
		</div>
	{/if}
</div>

