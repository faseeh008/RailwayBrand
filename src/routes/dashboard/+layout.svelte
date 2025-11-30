<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Home, Palette, Search, Sparkles, User, Settings, LogOut, Folder } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import BrandCard from '$lib/components/BrandCard.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { children, data } = $props();
	const isPreviewPage = $derived($page.url.pathname.startsWith('/dashboard/preview-html'));

	// Redirect if not authenticated
	if (!data?.user) {
		goto('/auth/login');
	}

	const navItems = [
		{ href: '/dashboard', icon: Home, label: 'Dashboard', exact: true },
		{ href: '/dashboard/builder', icon: Palette, label: 'Builder' },
		{ href: '/dashboard/audit', icon: Search, label: 'Audit' },
		{ href: '/dashboard/creative', icon: Sparkles, label: 'Creative' },
		{ href: '/dashboard/my-brands', icon: Folder, label: 'My Brands' }
	];

	function isActive(href: string, exact = false) {
		if (exact) {
			return $page.url.pathname === href;
		}
		return $page.url.pathname.startsWith(href);
	}

	// My Brands state
	let myBrands: any[] = [];
	let loadingBrands = false;

	async function loadBrands() {
		if (loadingBrands) return;
		loadingBrands = true;
		try {
			const response = await fetch('/api/brand-guidelines');
			if (response.ok) {
				const result = await response.json();
				if (result.success && result.guidelines) {
					myBrands = result.guidelines || [];
				} else {
					myBrands = [];
				}
			} else {
				myBrands = [];
			}
		} catch (error) {
			console.error('Failed to load brands:', error);
			myBrands = [];
		} finally {
			loadingBrands = false;
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

			// Remove from local state and reload
			myBrands = myBrands.filter(b => b.id !== brand.id);
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

<div class="flex h-screen bg-background">
	{#if !isPreviewPage}
		<!-- Sidebar -->
		<aside class="flex h-full w-72 flex-col overflow-hidden border-r border-border bg-card">
			<!-- Logo -->
			<div class="flex-shrink-0 border-b border-border p-6">
				<h1 class="text-xl font-bold text-foreground">EternaBrand</h1>
				<p class="text-sm text-muted-foreground">AI Brand Assistant</p>
			</div>

		<!-- Navigation -->
		<nav class="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
			<ul class="space-y-2">
				{#each navItems as item}
					<li>
					<a
						href={item.href}
						class="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(
							item.href,
							item.exact
						)
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
					>
							<item.icon class="mr-3 h-5 w-5" />
							{item.label}
						</a>
					</li>
				{/each}
			</ul>

			<Separator class="my-4" />

			<!-- My Brands Section -->
			<div class="mb-4">
				<h3 class="mb-3 px-3 text-sm font-semibold text-foreground">My Brands</h3>
				{#if loadingBrands}
					<div class="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
				{:else if myBrands.length === 0}
					<div class="px-3 py-2 text-xs text-muted-foreground">No brands saved yet</div>
				{:else}
					<div class="max-h-64 space-y-2 overflow-y-auto px-3">
						{#each myBrands
							.sort((a: any, b: any) => {
								const dateA = a.updatedAt || a.createdAt;
								const dateB = b.updatedAt || b.createdAt;
								if (!dateA && !dateB) return 0;
								if (!dateA) return 1;
								if (!dateB) return -1;
								return new Date(dateB).getTime() - new Date(dateA).getTime();
							})
							.slice(0, 2) as brand}
							<BrandCard {brand} onPreview={handlePreviewBrand} onDelete={handleDeleteBrand} compact={true} />
						{/each}
					</div>
				{/if}
			</div>

			<Separator class="my-4" />

			<!-- User Section -->
			<div class="space-y-2">
				<div class="px-3 py-2">
					<p class="text-sm font-medium text-gray-900 dark:text-gray-100">{data?.user?.name || 'User'}</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">{data?.user?.email}</p>
				</div>
				<div class="flex items-center justify-between px-3 py-2">
					<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
					<ThemeToggle />
				</div>
				<Button variant="ghost" class="w-full justify-start" size="sm" href="/auth/profile">
					<User class="mr-3 h-5 w-5" />
					Profile
				</Button>
				<Button variant="ghost" class="w-full justify-start" size="sm">
					<Settings class="mr-3 h-5 w-5" />
					Settings
				</Button>
				<Button variant="ghost" class="w-full justify-start" size="sm" href="/api/auth/logout">
					<LogOut class="mr-3 h-5 w-5" />
					Sign Out
				</Button>
			</div>
		</nav>
		</aside>
	{/if}

	<!-- Main Content -->
	<main class="flex-1 overflow-auto">
		<div class="p-8">
			{@render children?.()}
		</div>
	</main>
</div>
