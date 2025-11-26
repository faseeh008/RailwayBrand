<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { ArrowRight, Palette, Search, Sparkles, TrendingUp, Folder } from 'lucide-svelte';
	import BrandCard from '$lib/components/BrandCard.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let brands: any[] = [];
	let loadingBrands = false;
	let recentActivity: any[] = [];

	async function loadBrands() {
		if (loadingBrands) return;
		loadingBrands = true;
		try {
			const response = await fetch('/api/brand-guidelines');
			if (response.ok) {
				const result = await response.json();
				if (result.success && result.guidelines) {
					brands = result.guidelines || [];
					// Update recent activity from brands
					updateRecentActivity();
				}
			}
		} catch (error) {
			console.error('Failed to load brands:', error);
		} finally {
			loadingBrands = false;
		}
	}

	function updateRecentActivity() {
		if (!brands || brands.length === 0) {
			recentActivity = [];
			return;
		}

		// Create activity items from brands
		recentActivity = brands
			.filter((brand: any) => brand && brand.brandName)
			.sort((a: any, b: any) => {
				const dateA = a.updatedAt || a.createdAt;
				const dateB = b.updatedAt || b.createdAt;
				if (!dateA && !dateB) return 0;
				if (!dateA) return 1;
				if (!dateB) return -1;
				return new Date(dateB).getTime() - new Date(dateA).getTime();
			})
			.map((brand: any) => ({
				type: 'brand',
				icon: Palette,
				title: `Brand guidelines created for "${brand.brandName}"`,
				timestamp: brand.updatedAt || brand.createdAt
			}));
	}

	function formatTimeAgo(date: string | Date | null | undefined): string {
		if (!date) return 'Unknown';
		try {
			const now = new Date();
			const past = new Date(date);
			const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
			
			if (diffInSeconds < 60) return 'Just now';
			if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
			if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
			if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
			return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
		} catch {
			return 'Unknown';
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

			// Reload brands
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

<div class="mx-auto max-w-6xl">
	<!-- Welcome Header -->
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-3xl font-bold text-foreground">
			Welcome back, {data?.user?.name || 'User'}!
		</h1>
		<p class="text-muted-foreground">
			Ready to create amazing brand experiences? Let's get started.
		</p>
	</div>

	<!-- Quick Stats -->
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Brand Guidelines</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-foreground">3</div>
				<p class="flex items-center text-xs text-muted-foreground">
					<TrendingUp class="mr-1 h-3 w-3 text-primary" />
					+2 this month
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Audits Completed</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-foreground">12</div>
				<p class="flex items-center text-xs text-muted-foreground">
					<TrendingUp class="mr-1 h-3 w-3 text-primary" />
					+5 this week
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Creatives Generated</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-foreground">47</div>
				<p class="flex items-center text-xs text-muted-foreground">
					<TrendingUp class="mr-1 h-3 w-3 text-primary" />
					+15 this week
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Quick Actions -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-foreground">Quick Actions</h2>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Top Row: 2 Quick Action Cards -->
			<!-- Brand Builder -->
			<Card class="flex cursor-pointer flex-col transition-shadow hover:shadow-md">
				<CardHeader class="flex-1">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
						<Palette class="h-6 w-6 text-primary" />
					</div>
					<CardTitle class="text-lg">Create Brand Guidelines</CardTitle>
					<CardDescription>
						Generate comprehensive brand guidelines for your business
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button class="w-full" href="/dashboard/builder">
						Start Building
						<ArrowRight class="ml-2 h-4 w-4" />
					</Button>
				</CardContent>
			</Card>

			<!-- Brand Audit -->
			<Card class="flex cursor-pointer flex-col transition-shadow hover:shadow-md">
				<CardHeader class="flex-1">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
						<Search class="h-6 w-6 text-primary" />
					</div>
					<CardTitle class="text-lg">Audit Website</CardTitle>
					<CardDescription>Analyze your website against brand guidelines</CardDescription>
				</CardHeader>
				<CardContent>
					<Button class="w-full" href="/dashboard/audit">
						Start Audit
						<ArrowRight class="ml-2 h-4 w-4" />
					</Button>
				</CardContent>
			</Card>

			<!-- Bottom Row: 2 Cards (Creative + First Brand if exists) -->
			<!-- Creative Generator -->
			<Card class="flex cursor-pointer flex-col transition-shadow hover:shadow-md">
				<CardHeader class="flex-1">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
						<Sparkles class="h-6 w-6 text-primary" />
					</div>
					<CardTitle class="text-lg">Generate Creative</CardTitle>
					<CardDescription>Create branded social media and campaign content</CardDescription>
				</CardHeader>
				<CardContent>
					<Button class="w-full" href="/dashboard/creative">
						Create Content
						<ArrowRight class="ml-2 h-4 w-4" />
					</Button>
				</CardContent>
			</Card>

			<!-- First My Brand Card (if exists) -->
			{#if brands.length > 0}
				<BrandCard brand={brands[0]} onPreview={handlePreviewBrand} onDelete={handleDeleteBrand} />
			{:else}
				<!-- Placeholder or empty card -->
				<Card class="flex cursor-pointer flex-col transition-shadow hover:shadow-md">
					<CardHeader class="flex-1">
						<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
							<Folder class="h-6 w-6 text-primary" />
						</div>
						<CardTitle class="text-lg">My Brands</CardTitle>
						<CardDescription>View and manage your saved brand guidelines</CardDescription>
					</CardHeader>
					<CardContent>
						<Button class="w-full bg-primary text-primary-foreground hover:bg-primary/90" href="/dashboard/my-brands">
							My Brands
							<ArrowRight class="ml-2 h-4 w-4" />
						</Button>
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>

	<!-- Recent Activity -->
	<div>
		<h2 class="mb-4 text-xl font-semibold text-foreground">Recent Activity</h2>
		<Card>
			<CardContent class="p-6">
				{#if loadingBrands}
					<div class="flex items-center justify-center py-8">
						<div class="text-sm text-muted-foreground">Loading activity...</div>
					</div>
				{:else if recentActivity.length === 0}
					<div class="flex items-center justify-center py-8">
						<div class="text-sm text-muted-foreground">No recent activity</div>
					</div>
				{:else}
					<div class="space-y-4">
						{#each recentActivity as activity}
							<div class="flex items-center space-x-4">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
									<svelte:component this={activity.icon} class="h-4 w-4 text-primary" />
								</div>
								<div class="flex-1">
									<p class="text-sm font-medium text-foreground">
										{activity.title}
									</p>
									<p class="text-xs text-muted-foreground">
										{formatTimeAgo(activity.timestamp)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
