<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/stores';
	import { AlertCircle } from 'lucide-svelte';

	const message = $page.url.searchParams.get('message') || 'An authentication error occurred';
</script>

<Card>
	<CardHeader class="text-center">
		<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
			<AlertCircle class="h-6 w-6 text-red-600" />
		</div>
		<CardTitle class="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
		<CardDescription>Something went wrong during authentication</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4 text-center">
		<div class="rounded-lg border border-red-200 bg-red-50 p-4">
			<p class="text-sm text-red-800">
				{message}
			</p>
		</div>

		<div class="space-y-2">
			<Button href="/auth/login">Try Again</Button>
			<Button variant="outline" href="/">Back to Home</Button>
		</div>
	</CardContent>
</Card>
