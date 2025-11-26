<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	// import { Input } from '$lib/components/ui/input';
	// import { Label } from '$lib/components/ui/label';
	// import { Textarea } from '$lib/components/ui/textarea';
	// import { Separator } from '$lib/components/ui/separator';
	import { Sparkles } from 'lucide-svelte';
	// import { mockCreatives } from '$lib/data/mock-data';

	// let campaignGoal = '';
	// let selectedPlatform = '';
	// let productHighlights = '';
	// let targetAction = '';
	// let showCreatives = false;
	// let isGenerating = false;

	// const platforms = [
	// 	{ value: 'instagram', label: 'Instagram', icon: Instagram },
	// 	{ value: 'facebook', label: 'Facebook', icon: Facebook },
	// 	{ value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
	// 	{ value: 'twitter', label: 'Twitter (X)' },
	// 	{ value: 'tiktok', label: 'TikTok' },
	// 	{ value: 'youtube', label: 'YouTube' }
	// ];

	// const campaignTypes = [
	// 	'Product Launch',
	// 	'Brand Awareness',
	// 	'Lead Generation',
	// 	'Event Promotion',
	// 	'Sale/Discount',
	// 	'Educational Content',
	// 	'User Generated Content',
	// 	'Testimonial/Review'
	// ];

	// const callsToAction = [
	// 	'Shop Now',
	// 	'Learn More',
	// 	'Sign Up',
	// 	'Download',
	// 	'Contact Us',
	// 	'Book Demo',
	// 	'Get Started',
	// 	'Join Now'
	// ];

	// async function generateCreatives() {
	// 	if (!campaignGoal.trim() || !selectedPlatform.trim()) return;

	// 	isGenerating = true;
	// 	// Simulate generation time
	// 	setTimeout(() => {
	// 		isGenerating = false;
	// 		showCreatives = true;
	// 	}, 3000);
	// }

	// function downloadCreative(creative: (typeof mockCreatives)[0], format: string) {
	// 	alert(
	// 		`Downloading ${creative.title} as ${format.toUpperCase()}. This will be implemented in the full version!`
	// 	);
	// }

	// function regenerateCreative(creative: (typeof mockCreatives)[0]) {
	// 	alert(`Regenerating ${creative.title}. This will be implemented in the full version!`);
	// }
</script>

<div class="mx-auto max-w-6xl">
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-3xl font-bold text-foreground">Creative Generator</h1>
		<p class="text-muted-foreground">
			Create branded social media posts and campaign creatives with AI
		</p>
	</div>

	<!-- Feature Coming Soon -->
	<Card class="flex min-h-[500px] items-center justify-center">
		<CardContent class="p-12 text-center">
			<Sparkles class="mx-auto mb-6 h-20 w-20 text-primary opacity-50" />
			<h2 class="mb-4 text-2xl font-bold text-foreground">Feature Coming Soon</h2>
			<p class="mb-2 text-lg text-muted-foreground">
				We're working hard to bring you an amazing creative generation experience!
			</p>
			<p class="text-sm text-muted-foreground">
				This feature will allow you to create branded social media posts and campaign creatives using AI.
			</p>
		</CardContent>
	</Card>

	<!-- Commented out original content -->
	<!-- 
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<div class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Campaign Details</CardTitle>
					<CardDescription>Tell us about your campaign to generate targeted creatives</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					...
				</CardContent>
			</Card>
			...
		</div>
		<div class="space-y-6">
			...
		</div>
	</div>
	-->
</div>
