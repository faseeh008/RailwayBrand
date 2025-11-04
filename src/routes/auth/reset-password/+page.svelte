<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Eye, EyeOff } from 'lucide-svelte';

	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let isLoading = $state(false);
	let error = $state('');
	let success = $state(false);

	const token = $page.url.searchParams.get('token');

	if (!token) {
		goto('/auth/forgot-password');
	}

	async function handleSubmit(event: SubmitEvent) {
		isLoading = true;
		error = '';

		const formData = new FormData(event.target as HTMLFormElement);
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			isLoading = false;
			event.preventDefault();
			return;
		}

		try {
			const response = await fetch('/auth/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					token,
					password
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Reset failed');
			}

			success = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			isLoading = false;
			event.preventDefault();
		}
	}
</script>

<Card>
	<CardHeader class="text-center">
		<CardTitle class="text-2xl font-bold">Set new password</CardTitle>
		<CardDescription>Enter your new password below</CardDescription>
	</CardHeader>
	<CardContent>
		{#if success}
			<div class="space-y-4 text-center">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
					<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>
				<div>
					<h3 class="mb-2 text-lg font-medium text-gray-900">Password updated</h3>
					<p class="mb-4 text-sm text-gray-600">
						Your password has been successfully updated. You can now sign in with your new password.
					</p>
				</div>
				<Button href="/auth/login">Sign In</Button>
			</div>
		{:else}
			{#if error}
				<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}

			<form method="POST" action="/auth/reset-password" use:enhance={handleSubmit}>
				<div class="space-y-4">
					<div>
						<Label for="password">New Password</Label>
						<div class="relative mt-1">
							<Input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								required
								placeholder="Enter new password"
								minlength="8"
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 flex items-center pr-3"
								onclick={() => (showPassword = !showPassword)}
							>
								{#if showPassword}
									<EyeOff class="h-4 w-4 text-gray-400" />
								{:else}
									<Eye class="h-4 w-4 text-gray-400" />
								{/if}
							</button>
						</div>
					</div>

					<div>
						<Label for="confirmPassword">Confirm New Password</Label>
						<div class="relative mt-1">
							<Input
								id="confirmPassword"
								name="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								required
								placeholder="Confirm new password"
								minlength="8"
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 flex items-center pr-3"
								onclick={() => (showConfirmPassword = !showConfirmPassword)}
							>
								{#if showConfirmPassword}
									<EyeOff class="h-4 w-4 text-gray-400" />
								{:else}
									<Eye class="h-4 w-4 text-gray-400" />
								{/if}
							</button>
						</div>
					</div>

					<Button type="submit" class="w-full" disabled={isLoading}>
						{isLoading ? 'Updating...' : 'Update Password'}
					</Button>
				</div>
			</form>
		{/if}
	</CardContent>
</Card>
