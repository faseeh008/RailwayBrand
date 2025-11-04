<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
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
	import { Mail, Shield, CheckCircle, AlertCircle } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	const { data } = $props<{
		data: {
			email?: string;
			sent?: string;
			error?: string;
			success?: string;
			currentOtp?: string;
		};
	}>();

	let otp = $state('');
	let isLoading = $state(false);
	let isResending = $state(false);

	// Validate OTP input - only allow digits
	$effect(() => {
		// Remove any non-digit characters
		otp = otp.replace(/\D/g, '');
		// Limit to 6 digits
		if (otp.length > 6) {
			otp = otp.slice(0, 6);
		}
	});
</script>

<Card>
	<CardHeader class="text-center">
		<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
			<Shield class="h-6 w-6 text-blue-600" />
		</div>
		<CardTitle class="text-2xl font-bold">Verify Your Email</CardTitle>
		<CardDescription>
			Enter the 6-digit code sent to {data.email || 'your email address'}
		</CardDescription>
	</CardHeader>
	<CardContent>
		<!-- Success Message -->
		{#if data?.success}
			<div class="mb-6">
				<div class="rounded-md border border-green-200 bg-green-50 p-4">
					<div class="flex items-start gap-3">
						<div class="flex-shrink-0">
							<CheckCircle class="h-5 w-5 text-green-600" />
						</div>
						<div class="flex-1">
							<h3 class="text-sm font-medium text-green-800">Email Verified</h3>
							<div class="mt-1 text-sm text-green-700">
								{data.success}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Error Message -->
		{#if data?.error}
			<div class="mb-6">
				<div class="rounded-md border border-red-200 bg-red-50 p-4">
					<div class="flex items-start gap-3">
						<div class="flex-shrink-0">
							<AlertCircle class="h-5 w-5 text-red-600" />
						</div>
						<div class="flex-1">
							<h3 class="text-sm font-medium text-red-800">Verification Error</h3>
							<div class="mt-1 text-sm text-red-700">
								{data.error}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Email Sent Message -->
		{#if data?.sent === '1'}
			<div class="mb-6">
				<div class="rounded-md border border-blue-200 bg-blue-50 p-4">
					<div class="flex items-start gap-3">
						<div class="flex-shrink-0">
							<Mail class="h-5 w-5 text-blue-600" />
						</div>
						<div class="flex-1">
							<h3 class="text-sm font-medium text-blue-800">Email Sent</h3>
							<div class="mt-1 text-sm text-blue-700">
								Check your email for the verification code. The code will expire in 10 minutes.
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- OTP Form -->
		<form
			method="POST"
			action="?/verify"
			use:enhance={() => {
				isLoading = true;
				return async ({ result }) => {
					isLoading = false;
					if (result.type === 'redirect') {
						// Let the redirect happen naturally
						return;
					}
				};
			}}
			class="space-y-4"
		>
			<!-- Hidden email field -->
			{#if data.email}
				<input type="hidden" name="email" value={data.email} />
			{/if}

			<div>
				<Label for="otp">Verification Code</Label>
				<Input
					id="otp"
					name="otp"
					type="text"
					bind:value={otp}
					placeholder="Enter 6-digit code"
					maxlength="6"
					required
					class="mt-1 text-center text-lg tracking-widest"
					disabled={isLoading}
					oninput={(e) => {
						// Only allow digits
						const value = e.target.value.replace(/\D/g, '');
						if (value.length <= 6) {
							otp = value;
						}
					}}
				/>
				<p class="mt-1 text-xs text-gray-500">Enter the 6-digit code from your email</p>
			</div>

			<Button type="submit" disabled={isLoading || otp.length !== 6} class="w-full">
				{isLoading ? 'Verifying...' : 'Verify Email'}
			</Button>
		</form>

		<!-- Resend Code -->
		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600">Didn't receive the code?</p>
			<form
				method="POST"
				action="?/resend"
				use:enhance={() => {
					isResending = true;
					return async ({ result }) => {
						isResending = false;
						if (result.type === 'success' && result.data?.success) {
							// Show success message
							window.location.reload();
						}
					};
				}}
				class="inline"
			>
				{#if data.email}
					<input type="hidden" name="email" value={data.email} />
				{/if}
				<button
					type="submit"
					disabled={isResending}
					class="font-medium text-blue-600 underline hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isResending ? 'Sending...' : 'Resend code'}
				</button>
			</form>
		</div>

		<!-- Back to Login -->
		<div class="mt-4 text-center">
			<Button variant="outline" href="/auth/login">← Back to login</Button>
		</div>
	</CardContent>
</Card>
