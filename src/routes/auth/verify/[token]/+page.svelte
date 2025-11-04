<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle, XCircle, Loader } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let status = $state('loading');
	let message = $state('Verifying your email...');

	onMount(async () => {
		try {
			const token = $page.params.token;
			const response = await fetch(`/auth/verify/${token}`, {
				method: 'GET',
				redirect: 'manual'
			});

			if (response.ok || response.status === 302) {
				status = 'success';
				message = 'Email verified successfully! You can now sign in to your account.';
			} else {
				status = 'error';
				message = 'Invalid or expired verification token.';
			}
		} catch (error) {
			status = 'error';
			message = 'Verification failed. Please try again.';
		}
	});
</script>

<Card>
	<CardHeader class="text-center">
		<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
			{#if status === 'loading'}
				<Loader class="h-6 w-6 animate-spin text-blue-600" />
			{:else if status === 'success'}
				<CheckCircle class="h-6 w-6 text-green-600" />
			{:else}
				<XCircle class="h-6 w-6 text-red-600" />
			{/if}
		</div>
		<CardTitle
			class="text-2xl font-bold {status === 'success'
				? 'text-green-600'
				: status === 'error'
					? 'text-red-600'
					: 'text-blue-600'}"
		>
			{#if status === 'loading'}
				Verifying Email
			{:else if status === 'success'}
				Email Verified
			{:else}
				Verification Failed
			{/if}
		</CardTitle>
		<CardDescription>
			{message}
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4 text-center">
		{#if status === 'success'}
			<div class="rounded-lg border border-green-200 bg-green-50 p-4">
				<p class="text-sm text-green-800">
					Your email has been successfully verified. You can now access all features of EternaBrand.
				</p>
			</div>
			<Button href="/auth/signup">Continue to Create Account</Button>
		{:else if status === 'error'}
			<div class="rounded-lg border border-red-200 bg-red-50 p-4">
				<p class="text-sm text-red-800">
					The verification link may have expired or is invalid. Please request a new verification
					email.
				</p>
			</div>
			<div class="space-y-2">
				<Button href="/auth/signup">Sign Up Again</Button>
				<Button variant="outline" href="/auth/signup">Back to Create Account</Button>
			</div>
		{/if}
	</CardContent>
</Card>
