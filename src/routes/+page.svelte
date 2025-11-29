<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	
	let ArrowRight: any;
	let Palette: any;
	let Search: any;
	let Sparkles: any;
	
	$: if (browser && !ArrowRight) {
		import('lucide-svelte').then((lucide) => {
			ArrowRight = lucide.ArrowRight;
			Palette = lucide.Palette;
			Search = lucide.Search;
			Sparkles = lucide.Sparkles;
		});
	}
</script>

<!-- Hero Section -->
<section class="relative bg-gradient-to-br from-primary/10 to-accent/10 py-20">
	<div class="container mx-auto px-4 text-center">
		<div class="absolute top-4 right-4 z-10">
			<ThemeToggle />
		</div>
		<h1 class="mb-4 text-5xl font-bold text-foreground">EternaBrand</h1>
		<p class="mb-6 text-2xl font-medium text-primary">AI Brand Guideline Assistant</p>
		<p class="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
			Generate complete brand guidelines, audit existing assets, and create stunning branded content
			with the power of AI
		</p>
		<div class="flex justify-center gap-4">
			<Button size="lg" class="px-8" href="/auth/signup">
				Start Free Trial
				{#if browser && ArrowRight}
					<svelte:component this={ArrowRight} class="ml-2 h-5 w-5" />
				{/if}
			</Button>
			<Button variant="outline" size="lg" href="/auth/login">Login</Button>
		</div>
	</div>
</section>

<!-- Features Overview -->
<section class="py-20">
	<div class="container mx-auto px-4">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-3xl font-bold text-foreground">
				Everything you need to build a consistent brand
			</h2>
			<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
				From brand guidelines to creative assets, EternaBrand helps you maintain brand consistency
				across all touchpoints
			</p>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			<!-- Brand Builder -->
			<Card class="text-center">
				<CardHeader>
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
					>
						{#if browser && Palette}
							<svelte:component this={Palette} class="h-6 w-6 text-primary" />
						{/if}
					</div>
					<CardTitle>Brand Builder</CardTitle>
					<CardDescription>
						Generate complete brand guidelines including logos, colors, typography, and tone of
						voice
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li>• Logo generation & guidelines</li>
						<li>• Color palette creation</li>
						<li>• Typography recommendations</li>
						<li>• Tone of voice definition</li>
					</ul>
				</CardContent>
			</Card>

			<!-- Brand Audit -->
			<Card class="text-center">
				<CardHeader>
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
					>
						{#if browser && Search}
							<svelte:component this={Search} class="h-6 w-6 text-primary" />
						{/if}
					</div>
					<CardTitle>Brand Audit</CardTitle>
					<CardDescription>
						Analyze existing websites and assets against your brand guidelines
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li>• Website compliance check</li>
						<li>• Asset consistency analysis</li>
						<li>• Automated fix suggestions</li>
						<li>• Before/after previews</li>
					</ul>
				</CardContent>
			</Card>

			<!-- Creative Generator -->
			<Card class="text-center">
				<CardHeader>
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10"
					>
						{#if browser && Sparkles}
							<svelte:component this={Sparkles} class="h-6 w-6 text-accent-foreground" />
						{/if}
					</div>
					<CardTitle>Creative Generator</CardTitle>
					<CardDescription>
						Create branded social media posts and campaign creatives instantly
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li>• Social media templates</li>
						<li>• Campaign creatives</li>
						<li>• Multi-platform formats</li>
						<li>• Brand-consistent designs</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="bg-muted py-20">
	<div class="container mx-auto px-4 text-center">
		<h2 class="mb-4 text-3xl font-bold text-foreground">Ready to build your brand?</h2>
		<p class="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
			Join thousands of businesses using EternaBrand to create consistent, professional brand
			experiences
		</p>
		<Button size="lg" class="px-8" href="/auth/signup">
			Get Started for Free
			{#if browser && ArrowRight}
				<svelte:component this={ArrowRight} class="ml-2 h-5 w-5" />
			{/if}
		</Button>
	</div>
</section>
