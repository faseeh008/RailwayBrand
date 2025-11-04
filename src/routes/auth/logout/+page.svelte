<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Redirect to login page after a brief moment
		setTimeout(() => {
			goto('/auth/login');
		}, 1000);
	});
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4"
>
	<div class="text-center">
		<div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-400"></div>
		<h1 class="mb-2 text-xl font-semibold text-white">Signing out...</h1>
		<p class="text-gray-300">You will be redirected to the login page.</p>
	</div>
</div>
