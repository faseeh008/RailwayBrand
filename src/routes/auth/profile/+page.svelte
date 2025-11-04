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
	import { Eye, EyeOff, User, Mail, Calendar, LogOut } from 'lucide-svelte';

	const { data, form } = $props<{
		data: {
			user?: any;
		};
		form?: any;
	}>();

	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let activeTab = $state('profile');

	// Redirect if no user
	if (!data?.user) {
		goto('/auth/login');
	}

	async function handleSignOut() {
		// Redirect to logout endpoint
		goto('/api/auth/logout');
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-2xl">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-4xl font-bold text-gray-900">EternaBrand</h1>
			<p class="text-lg font-medium text-blue-600">Account Settings</p>
		</div>

		<div class="overflow-hidden rounded-lg bg-white shadow-xl">
			<!-- Tab Navigation -->
			<div class="border-b border-gray-200">
				<nav class="-mb-px flex">
					<button
						class="flex-1 border-b-2 px-6 py-4 text-center text-sm font-medium {activeTab ===
						'profile'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						onclick={() => (activeTab = 'profile')}
					>
						Profile
					</button>
					<button
						class="flex-1 border-b-2 px-6 py-4 text-center text-sm font-medium {activeTab ===
						'password'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						onclick={() => (activeTab = 'password')}
					>
						Password
					</button>
				</nav>
			</div>

			<div class="p-6">
				{#if activeTab === 'profile'}
					<!-- Profile Tab -->
					<Card>
						<CardHeader>
							<CardTitle class="flex items-center">
								<User class="mr-2 h-5 w-5" />
								Profile Information
							</CardTitle>
							<CardDescription>Update your personal information</CardDescription>
						</CardHeader>
						<CardContent>
							{#if form?.success}
								<div class="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
									<p class="text-sm text-green-800">{form.success}</p>
								</div>
							{/if}

							<form method="POST" action="?/updateProfile" use:enhance class="space-y-4">
								<div>
									<Label for="name">Full Name</Label>
									<Input
										id="name"
										name="name"
										type="text"
										value={form?.user?.name || data?.user?.name || ''}
										required
										class="mt-1"
									/>
								</div>

								<div>
									<Label for="email">Email Address</Label>
									<div class="mt-1 flex items-center">
										<Mail class="mr-2 h-4 w-4 text-gray-400" />
										<Input
											id="email"
											type="email"
											value={form?.user?.email || data?.user?.email || ''}
											readonly
											class="mt-1 cursor-not-allowed bg-gray-50"
										/>
									</div>
									<p class="mt-1 text-xs text-gray-500">
										Email address cannot be changed for security reasons.
									</p>
								</div>

								{#if form?.user?.emailVerified || data?.user?.emailVerified}
									<div class="flex items-center text-sm text-green-600">
										<svg class="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clip-rule="evenodd"
											/>
										</svg>
										Email verified
									</div>
								{/if}

								<Button type="submit">Update Profile</Button>
							</form>
						</CardContent>
					</Card>
				{:else}
					<!-- Password Tab -->
					<Card>
						<CardHeader>
							<CardTitle>Change Password</CardTitle>
							<CardDescription>Update your account password</CardDescription>
						</CardHeader>
						<CardContent>
							<form method="POST" action="?/changePassword" use:enhance class="space-y-4">
								<div>
									<Label for="currentPassword">Current Password</Label>
									<div class="relative mt-1">
										<Input
											id="currentPassword"
											name="currentPassword"
											type={showCurrentPassword ? 'text' : 'password'}
											required
											placeholder="Enter current password"
										/>
										<button
											type="button"
											class="absolute inset-y-0 right-0 flex items-center pr-3"
											onclick={() => (showCurrentPassword = !showCurrentPassword)}
										>
											{#if showCurrentPassword}
												<EyeOff class="h-4 w-4 text-gray-400" />
											{:else}
												<Eye class="h-4 w-4 text-gray-400" />
											{/if}
										</button>
									</div>
								</div>

								<div>
									<Label for="newPassword">New Password</Label>
									<div class="relative mt-1">
										<Input
											id="newPassword"
											name="newPassword"
											type={showNewPassword ? 'text' : 'password'}
											required
											placeholder="Enter new password"
											minlength="6"
										/>
										<button
											type="button"
											class="absolute inset-y-0 right-0 flex items-center pr-3"
											onclick={() => (showNewPassword = !showNewPassword)}
										>
											{#if showNewPassword}
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
											minlength="6"
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

								<Button type="submit">Update Password</Button>
							</form>
						</CardContent>
					</Card>
				{/if}

				<div class="mt-6 border-t border-gray-200 pt-6">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-sm font-medium text-gray-900">Account Actions</h3>
							<p class="text-sm text-gray-500">Manage your account settings</p>
						</div>
						<Button variant="outline" onclick={handleSignOut} class="flex items-center">
							<LogOut class="mr-2 h-4 w-4" />
							Sign Out
						</Button>
					</div>
				</div>

				<div class="mt-4 text-center">
					<a href="/dashboard" class="text-sm font-medium text-blue-600 hover:text-blue-500">
						← Back to Dashboard
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
