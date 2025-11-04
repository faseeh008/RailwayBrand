<script lang="ts">
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8"
>
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="mb-2 text-4xl font-bold text-gray-900">EternaBrand</h1>
			<p class="text-lg font-medium text-blue-600">AI Brand Guideline Assistant</p>
		</div>

		<div class="rounded-lg bg-white px-6 py-8 shadow-xl">
			<slot />
		</div>

		<div class="text-center">
			<p class="text-sm text-gray-600">
				<a href="/" class="font-medium text-blue-600 hover:text-blue-500"> ← Back to Home </a>
			</p>
		</div>
	</div>
</div>

<style>
	/* Global styles */
	:global(html, body) {
		height: 100%;
		font-family: 'Inter', sans-serif;
	}

	:global(body) {
		margin: 0;
	}
</style>
