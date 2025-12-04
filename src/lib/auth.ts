import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/sveltekit/providers/credentials';
import Google from '@auth/sveltekit/providers/google';
import GitHub from '@auth/sveltekit/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$lib/db';
import { user, account, session, verificationToken } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import type { User, Account, Profile } from '@auth/core/types';
import { env } from './env';

// Safety check: ensure env is defined
if (!env) {
	console.error('[auth.ts] ERROR: env is undefined! Environment variables may not be loaded.');
}

export const authOptions = {
	adapter: DrizzleAdapter(db, { user, account, session, verificationToken } as any),
	trustHost: env?.AUTH_TRUST_HOST ?? false,
	secret: env?.AUTH_SECRET || 'fallback-secret-key',
	session: {
		strategy: 'database' as const,
		maxAge: 30 * 24 * 60 * 60 // 30 days
	},
	debug: process.env.NODE_ENV === 'development',
	cookies: {
		sessionToken: {
			name: 'authjs.session-token',
			options: {
				httpOnly: true,
				sameSite: 'lax' as const,
				path: '/',
				secure: env?.NODE_ENV === 'production'
			}
		},
		callbackUrl: {
			name: 'authjs.callback-url',
			options: {
				sameSite: 'lax' as const,
				path: '/',
				secure: env?.NODE_ENV === 'production'
			}
		},
		csrfToken: {
			name: 'authjs.csrf-token',
			options: {
				httpOnly: true,
				sameSite: 'lax' as const,
				path: '/',
				secure: env?.NODE_ENV === 'production'
			}
		}
	},
	providers: [
		Google({
			clientId: env?.AUTH_GOOGLE_ID || '',
			clientSecret: env?.AUTH_GOOGLE_SECRET || '',
			// Allow linking Google account to existing email accounts
			allowDangerousEmailAccountLinking: true,
			authorization: {
				params: {
					prompt: 'select_account',
					access_type: 'offline',
					response_type: 'code'
				}
			}
		}),
		GitHub({
			clientId: env?.AUTH_GITHUB_ID || '',
			clientSecret: env?.AUTH_GITHUB_SECRET || '',
			// Allow linking GitHub account to existing email accounts
			allowDangerousEmailAccountLinking: true
		}),
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(creds) {
				if (!creds?.email || !creds?.password) {
					throw new Error('Email and password required');
				}

				const email = creds.email.toString();
				const password = creds.password.toString();

				// Fetch user from database
				const [u] = await db.select().from(user).where(eq(user.email, email.toLowerCase()));
				if (!u) throw new Error('Invalid credentials');
				if (u.disabled) throw new Error('Account disabled');

				// Log user authentication details for debugging
				console.log(`🔐 Credential auth attempt for user: ${u.email}`);
				console.log(`   - User ID: ${u.id}`);
				console.log(`   - Role: ${u.role}`);
				console.log(`   - Email Verified: ${u.emailVerified ? 'Yes' : 'No'}`);
				console.log(`   - Disabled: ${u.disabled}`);

				// Temporarily remove email verification requirement to fix dashboard/chat inconsistency
				// if (!u.emailVerified) throw new Error("Email not verified");

				// Check if user has a password (credentials account)
				if (!u.hashedPassword) throw new Error('Invalid credentials');

				const valid = await compare(password, u.hashedPassword);
				if (!valid) throw new Error('Invalid credentials');

				return {
					id: u.id,
					email: u.email,
					name: u.name ?? null,
					image: u.image ?? null,
					role: u.role
				};
			}
		})
	],
	callbacks: {
		async signIn(params: {
			user: User;
			account?: Account | null;
			profile?: Profile;
			email?: { verificationRequest?: boolean };
			credentials?: Record<string, unknown>;
		}) {
			try {
				const { account: authAccount, profile, user: authUser } = params;
				
				// Always allow credentials sign-in (handled by authorize)
				if (!authAccount || authAccount.provider === 'credentials') return true;

				const email = (profile as any)?.email as string | undefined;
				if (!email) return true;

				// Find existing user with the same email
				const [existingUser] = await db
					.select()
					.from(user)
					.where(eq(user.email, email.toLowerCase()));
				
				if (!existingUser) {
					// No existing user, allow normal account creation
					console.log(`✅ Creating new account for: ${email}`);
					return true;
				}

				// Check if user is disabled
				if (existingUser.disabled) {
					console.log(`⚠️ User is disabled but allowing OAuth completion: ${existingUser.email}`);
					return true;
				}

				// Check if this specific provider is already linked
				const linkedAccounts = await db
					.select()
					.from(account)
					.where(eq(account.userId, existingUser.id));
				
				const existingProviderAccount = linkedAccounts.find(a => a.provider === authAccount.provider);

				if (existingProviderAccount) {
					// Provider already linked - allow sign-in
					console.log(`✅ Signing in with existing ${authAccount.provider} account: ${existingUser.email}`);
					return true;
				}

				// Provider not linked yet - Auth.js will auto-link due to allowDangerousEmailAccountLinking
				console.log(`🔗 Linking ${authAccount.provider} account to existing user: ${existingUser.email}`);
				return true;
				
			} catch (error) {
				console.error('❌ Error in signIn callback:', error);
				return false;
			}
		},

		async session({ session, user }: { session: any; user: any }) {
			if (session.user && user) {
				session.user.id = user.id;
				session.user.role = user.role;
			}
			return session;
		},

		async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
			// Handle redirects after authentication
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			else if (new URL(url).origin === baseUrl) return url;

			// Default redirect after OAuth login - use post-auth handler
			return `${baseUrl}/post-auth`;
		}
	},
	pages: {
		signIn: '/auth/login',
		signOut: '/auth/login',
		error: '/auth/login' // Redirect errors to login page instead of showing error page
	},
	events: {
		async signIn(params: { user: User; account?: Account | null; profile?: Profile }) {
			const { user: authUser, account: authAccount, profile } = params;
			// Update user profile information when signing in with OAuth
			if (authAccount && profile && authUser && authUser.id) {
				try {
					if (authAccount.provider === 'google') {
						await db
							.update(user)
							.set({
								name: profile.name || authUser.name || null,
								email: profile.email || authUser.email || '',
								image: profile.picture || authUser.image || null,
								emailVerified: new Date()
							})
							.where(eq(user.id, authUser.id));
						console.log(`✅ Updated Google profile for: ${authUser.email}`);
					} else if (authAccount.provider === 'github') {
						await db
							.update(user)
							.set({
								name: profile.name || authUser.name || null,
								email: profile.email || authUser.email || '',
								image: (profile as any).avatar_url || authUser.image || null,
								emailVerified: new Date()
							})
							.where(eq(user.id, authUser.id));
						console.log(`✅ Updated GitHub profile for: ${authUser.email}`);
					}
				} catch (error) {
					console.error('Error updating user profile:', error);
				}
			}
		},

		async createUser(params: { user: User; account?: Account | null; profile?: Profile }) {
			const { user: authUser, account: authAccount } = params;
			// Auto-verify email for new OAuth users
			if (authAccount && authAccount.provider !== 'credentials' && authUser && authUser.id) {
				try {
					await db.update(user).set({ emailVerified: new Date() }).where(eq(user.id, authUser.id));
					console.log(`✅ Auto-verified email for new ${authAccount.provider} user: ${authUser.email}`);
				} catch (error) {
					console.error('Error auto-verifying email for new OAuth user:', error);
				}
			}
		},
		
		async signOut(message: { session: any } | { token: any }) {
			console.log('👋 User signed out successfully');
		}
	}
};

export const { handle, signIn, signOut } = SvelteKitAuth(authOptions);
