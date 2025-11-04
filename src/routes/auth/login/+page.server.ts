import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/db';
import { user, session, verificationToken } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { sendOtpEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Check if user is already authenticated
	const session = await locals.auth();
	if (session?.user) {
		const dest = (session.user as any).role === 'admin' ? '/dashboard' : '/dashboard';
		throw redirect(303, dest);
	}

	// Handle Auth.js errors explicitly (e.g., OAuthAccountNotLinked)
	const error = url.searchParams.get('error');
	const verified = url.searchParams.get('verified');

	if (error) {
		let message = 'An error occurred during sign in. Please try again.';
		if (error === 'OAuthAccountNotLinked') {
			message =
				'Another account already exists with the same email. Please sign in using your original method (e.g., Credentials)';
		} else if (error === 'OAuthAccountExists') {
			message = 'This email is already associated with a different provider.';
		} else if (error === 'disabled') {
			message =
				url.searchParams.get('message') || 'Account is disabled. Please contact an administrator.';
		}

		return { error: { type: error, message, provider: null } };
	}

	if (verified === 'true') {
		return { success: 'Email verified successfully! You can now sign in to your account.' };
	}

	return {};
};

export const actions: Actions = {
	signin: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(data.get('password') ?? '');

		if (!email || !password)
			return fail(400, {
				action: 'signin',
				error: true,
				message: 'Email and password are required.'
			});

		const [userRecord] = await db.select().from(user).where(eq(user.email, email));
		if (!userRecord || !userRecord.hashedPassword)
			return fail(400, { action: 'signin', error: true, message: 'Incorrect email or password.' });

		// Check if user is disabled FIRST - before any other checks
		if (userRecord.disabled)
			return fail(403, {
				action: 'signin',
				error: true,
				message: 'Account is disabled. Please contact an administrator.'
			});

		// Check if email is verified - require verification for credential-based accounts
		if (!userRecord.emailVerified) {
			// Generate new OTP
			const otp = Math.floor(100000 + Math.random() * 900000).toString();
			const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

			try {
				await db.delete(verificationToken).where(eq(verificationToken.identifier, email));
			} catch (e) {
				// Ignore errors when clearing old tokens
			}

			try {
				await db.insert(verificationToken).values({ identifier: email, token: otp, expires });
			} catch (tokenError) {
				return fail(500, {
					action: 'signin',
					error: true,
					message: 'Failed to create verification token. Please try again.'
				});
			}

			// Try sending email, but do not block the flow if SMTP fails
			let sent = 1;
			try {
				await sendOtpEmail(email, otp);
			} catch (e) {
				sent = 0;
			}

			const dest = `/auth/verify?email=${encodeURIComponent(email)}&sent=${sent}`;
			throw redirect(303, dest);
		}

		const valid = await compare(password, userRecord.hashedPassword);
		if (!valid)
			return fail(400, { action: 'signin', error: true, message: 'Incorrect email or password.' });

		// Create session
		const sessionId = randomUUID();
		const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		await db.insert(session).values({
			sessionToken: sessionId,
			userId: userRecord.id,
			expires
		});

		// Set session cookie
		cookies.set('authjs.session-token', sessionId, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60 // 30 days
		});

		// Redirect based on role
		const dest = userRecord.role === 'admin' ? '/dashboard' : '/dashboard';
		throw redirect(303, dest);
	}
};
