<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Eye, EyeOff } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	const { data } = $props<{
		data: { error?: { type: string; message: string; provider: string | null } };
	}>();

	let showPassword = $state(false);
</script>

<div in:fly={{ y: 20, duration: 300 }}>
	<div class="mb-8 text-center">
		<h2 class="mb-2 text-2xl font-bold text-gray-900">Create your account</h2>
		<p class="text-gray-600">Join EternaBrand and start building your brand guidelines with AI</p>
	</div>

	<!-- Social Login Buttons -->
	<div class="mb-6 space-y-3">
		<form method="POST" action="/auth/signin/google?callbackUrl=/post-auth">
			<Button type="submit" variant="outline" class="w-full">
				<svg class="mr-2 h-5 w-5" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Continue with Google
			</Button>
		</form>

		<form method="POST" action="/auth/signin/github?callbackUrl=/post-auth">
			<Button type="submit" variant="outline" class="w-full">
				<svg class="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
					/>
				</svg>
				Continue with GitHub
			</Button>
		</form>
	</div>

	<!-- Divider -->
	<div class="relative mb-6">
		<div class="absolute inset-0 flex items-center">
			<div class="w-full border-t border-gray-300"></div>
		</div>
		<div class="relative flex justify-center text-sm">
			<span class="bg-white px-2 text-gray-500">or continue with email</span>
		</div>
	</div>

	<!-- Error Message -->
	{#if data?.error}
		<div class="mb-6">
			<div class="rounded-md border border-red-200 bg-red-50 p-4">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-medium text-red-800">Registration Error</h3>
						<div class="mt-1 text-sm text-red-700">
							{data.error.message}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Registration Form -->
	<form method="POST" action="?/register" class="space-y-4">
		<div>
			<Label for="name">Full Name</Label>
			<Input id="name" name="name" type="text" placeholder="Enter your full name" class="mt-1" />
		</div>

		<div>
			<Label for="email">Email Address</Label>
			<Input
				id="email"
				name="email"
				type="email"
				required
				placeholder="Enter your email"
				class="mt-1"
			/>
		</div>

		<div>
			<Label for="password">Password</Label>
			<div class="relative mt-1">
				<Input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					required
					placeholder="Create a password"
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

		<Button type="submit" class="w-full">Create Account</Button>
	</form>

	<!-- Sign In Link -->
	<div class="mt-6 text-center">
		<p class="text-sm text-gray-600">
			Already have an account?
			<a href="/auth/login" class="font-medium text-blue-600 hover:text-blue-500"> Sign in </a>
		</p>
	</div>
</div>
