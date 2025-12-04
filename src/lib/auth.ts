import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/sveltekit/providers/credentials';
import Google from '@auth/sveltekit/providers/google';
import GitHub from '@auth/sveltekit/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$lib/db';
import { user, account, session, verificationToken } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import type { User, Account, Profile } from '@auth/core/types';
import type { Adapter, AdapterUser, AdapterAccount } from '@auth/core/adapters';
import { env } from './env';
import { AsyncLocalStorage } from 'async_hooks';

// Safety check
if (!env) {
	console.error('[auth.ts] ERROR: env is undefined!');
}

// Request-scoped storage for OAuth flow tracking (thread-safe for concurrent requests)
interface OAuthFlowContext {
	isOAuthFlow: boolean;
	checkedAccount: boolean;
}
const oauthContext = new AsyncLocalStorage<OAuthFlowContext>();

// Create base adapter
const baseAdapter = DrizzleAdapter(db, { user, account, session, verificationToken } as any);

// Custom adapter that forces email account linking to work
const linkingAdapter: Adapter = {
	...baseAdapter,
	
	async getUserByAccount(providerAccount: { provider: string; providerAccountId: string }): Promise<AdapterUser | null> {
		const ctx = oauthContext.getStore();
		if (ctx) {
			ctx.isOAuthFlow = true;
			ctx.checkedAccount = true;
		}
		
		console.log(`🔍 getUserByAccount: ${providerAccount.provider}`);
		const result = await baseAdapter.getUserByAccount!(providerAccount);
		
		if (result) {
			console.log(`✅ Existing OAuth account found: ${result.email}`);
			// Found existing account - regular sign-in, no special handling needed
			if (ctx) ctx.isOAuthFlow = false;
		} else {
			console.log(`ℹ️ No existing account for provider ${providerAccount.provider}`);
		}
		
		return result;
	},

	async getUserByEmail(email: string): Promise<AdapterUser | null> {
		const ctx = oauthContext.getStore();
		
		// In OAuth flow after checking account: bypass email check to prevent conflict error
		// This tricks Auth.js into thinking no user exists with this email
		if (ctx?.isOAuthFlow && ctx?.checkedAccount) {
			console.log(`🔓 OAuth flow: Bypassing email check for ${email}`);
			return null; // Return null to skip the "account exists" error
		}
		
		console.log(`🔍 getUserByEmail: ${email}`);
		return baseAdapter.getUserByEmail!(email);
	},

	async createUser(userData: Omit<AdapterUser, "id">): Promise<AdapterUser> {
		console.log(`👤 createUser: ${userData.email}`);
		
		// Since we returned null from getUserByEmail, Auth.js thinks this is a new user
		// But we need to check if user actually exists and return them for linking
		const existingUser = await baseAdapter.getUserByEmail!(userData.email!);
		
		if (existingUser) {
			console.log(`🔗 User exists (${existingUser.id}), returning for OAuth linking`);
			return existingUser;
		}
		
		// Truly new user - create them
		const newUser = await baseAdapter.createUser!(userData);
		console.log(`✅ Created new user: ${newUser.id}`);
		return newUser;
	},

	async linkAccount(accountData: AdapterAccount): Promise<AdapterAccount | null | undefined> {
		console.log(`🔗 linkAccount: ${accountData.provider} -> user ${accountData.userId}`);
		
		try {
			return await baseAdapter.linkAccount!(accountData);
		} catch (error: any) {
			// Handle duplicate gracefully (account already linked)
			if (error.code === '23505' || error.message?.includes('duplicate')) {
				console.log(`ℹ️ Account already linked, continuing`);
				return accountData;
			}
			throw error;
		}
	}
};

// Auth configuration
const authConfig = {
	adapter: linkingAdapter,
	trustHost: env?.AUTH_TRUST_HOST ?? false,
	secret: env?.AUTH_SECRET || 'fallback-secret-key',
	session: {
		strategy: 'database' as const,
		maxAge: 30 * 24 * 60 * 60
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

				const email = creds.email.toString().toLowerCase();
				const password = creds.password.toString();

				const [u] = await db.select().from(user).where(eq(user.email, email));
				if (!u) throw new Error('Invalid credentials');
				if (u.disabled) throw new Error('Account disabled');
				if (!u.hashedPassword) throw new Error('Invalid credentials');

				const valid = await compare(password, u.hashedPassword);
				if (!valid) throw new Error('Invalid credentials');

				console.log(`🔐 Credentials auth: ${u.email}`);

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
		async signIn({ user: authUser, account: authAccount, profile }: {
			user: User;
			account?: Account | null;
			profile?: Profile;
		}) {
			if (!authAccount || authAccount.provider === 'credentials') {
				return true;
			}

			const email = (profile as any)?.email?.toLowerCase();
			if (!email) return true;

			// Block disabled users
			const [existingUser] = await db.select().from(user).where(eq(user.email, email));
			if (existingUser?.disabled) {
				console.log(`❌ Disabled user: ${email}`);
				return false;
			}

			console.log(`✅ OAuth signIn allowed: ${email} via ${authAccount.provider}`);
			return true;
		},

		async session({ session, user: dbUser }: { session: any; user: any }) {
			if (session.user && dbUser) {
				session.user.id = dbUser.id;
				session.user.role = dbUser.role;
			}
			return session;
		},

		async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			if (new URL(url).origin === baseUrl) return url;
			return `${baseUrl}/post-auth`;
		}
	},
	pages: {
		signIn: '/auth/login',
		signOut: '/auth/login',
		error: '/auth/login'
	},
	events: {
		async signIn({ user: authUser, account: authAccount, profile }) {
			if (authAccount?.provider && authAccount.provider !== 'credentials' && authUser?.id) {
				try {
					const updateData: any = { emailVerified: new Date() };
					if (profile?.name) updateData.name = profile.name;
					if ((profile as any)?.picture) updateData.image = (profile as any).picture;
					if ((profile as any)?.avatar_url) updateData.image = (profile as any).avatar_url;
					
					await db.update(user).set(updateData).where(eq(user.id, authUser.id));
				} catch (e) {
					console.error('Profile update error:', e);
				}
			}
		},
		async signOut() {
			console.log('👋 Signed out');
		}
	}
};

// Create auth handlers
const { handle: baseHandle, signIn, signOut } = SvelteKitAuth(authConfig);

// Wrap handle to provide OAuth context for each request
const handle: typeof baseHandle = async (input) => {
	return oauthContext.run({ isOAuthFlow: false, checkedAccount: false }, () => {
		return baseHandle(input);
	});
};

export { handle, signIn, signOut };
export const authOptions = authConfig;