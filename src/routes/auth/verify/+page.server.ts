import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { user, verificationToken, session as sessionTable } from '$lib/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { sendOtpEmail } from '$lib/server/email';
import { randomUUID } from 'node:crypto';

export const load: PageServerLoad = async ({ url }) => {
	const email = url.searchParams.get('email');
	const sent = url.searchParams.get('sent');

	return {
		email: email || undefined,
		sent: sent || undefined
	};
};

export const actions: Actions = {
	verify: async ({ request, url, cookies }) => {
		const formData = await request.formData();
		const otp = String(formData.get('otp') ?? '').trim();
		const email =
			url.searchParams.get('email') ||
			String(formData.get('email') ?? '')
				.trim()
				.toLowerCase();

		console.log(`[verify] Form data:`, {
			otp,
			email,
			urlEmail: url.searchParams.get('email'),
			formEmail: formData.get('email')
		});

		if (!otp || !email) {
			console.log(`[verify] Missing required fields:`, { otp: !!otp, email: !!email });
			return fail(400, { error: 'OTP and email are required' });
		}

		// Validate OTP format
		if (!/^\d{6}$/.test(otp)) {
			console.log(`[verify] Invalid OTP format:`, otp);
			return fail(400, { error: 'OTP must be exactly 6 digits' });
		}

		try {
			console.log(`[verify] Attempting to verify OTP: ${otp} for email: ${email}`);

			// Find the verification token
			const [tokenRecord] = await db
				.select()
				.from(verificationToken)
				.where(
					and(
						eq(verificationToken.identifier, email),
						eq(verificationToken.token, otp),
						gt(verificationToken.expires, new Date())
					)
				);

			console.log(`[verify] Token record found:`, tokenRecord ? 'Yes' : 'No');
			console.log(`[verify] Token details:`, tokenRecord);

			// Also check if there are any tokens for this email (for debugging)
			const allTokens = await db
				.select()
				.from(verificationToken)
				.where(eq(verificationToken.identifier, email));
			console.log(`[verify] All tokens for ${email}:`, allTokens);

			if (!tokenRecord) {
				console.log(`[verify] Invalid or expired token for ${email}`);

				// Check if there are any tokens for this email to provide better error message
				if (allTokens.length > 0) {
					const latestToken = allTokens[0];
					const isExpired = new Date() > latestToken.expires;
					if (isExpired) {
						return fail(400, { error: 'Verification code has expired. Please request a new one.' });
					} else {
						return fail(400, {
							error: 'Invalid verification code. Please check the code and try again.'
						});
					}
				} else {
					return fail(400, { error: 'No verification code found. Please request a new one.' });
				}
			}

			console.log(`[verify] Updating user email verification status for ${email}`);

			// Update user email verification status
			await db.update(user).set({ emailVerified: new Date() }).where(eq(user.email, email));

			// Delete the used verification token
			await db
				.delete(verificationToken)
				.where(and(eq(verificationToken.identifier, email), eq(verificationToken.token, otp)));

			// Get the user record to create a session
			const [userRecord] = await db.select().from(user).where(eq(user.email, email));

			if (userRecord) {
				console.log(`[verify] Creating session for user: ${userRecord.id}`);

				// Check if user already has an active session
				const [existingSession] = await db
					.select()
					.from(sessionTable)
					.where(and(eq(sessionTable.userId, userRecord.id), gt(sessionTable.expires, new Date())));

				let sessionId;
				if (existingSession) {
					// Use existing session
					sessionId = existingSession.sessionToken;
					console.log(`[verify] Using existing session for user: ${userRecord.id}`);
				} else {
					// Create a new session for the user to automatically log them in
					sessionId = randomUUID();
					const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

					await db.insert(sessionTable).values({
						sessionToken: sessionId,
						userId: userRecord.id,
						expires
					});
					console.log(`[verify] Created new session for user: ${userRecord.id}`);
				}

				// Set the Auth.js session cookie
				cookies.set('authjs.session-token', sessionId, {
					path: '/',
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					maxAge: 30 * 24 * 60 * 60 // 30 days
				});

				console.log(`[verify] Redirecting to dashboard for user: ${userRecord.id}`);
				// Redirect directly to dashboard
				throw redirect(303, '/dashboard');
			}

			console.log(`[verify] User record not found, redirecting to signup`);
			// Fallback redirect
			throw redirect(303, '/auth/signup?verified=true');
		} catch (error) {
			console.error('Verification error:', error);
			return fail(500, { error: 'An error occurred during verification' });
		}
	},

	resend: async ({ request, url }) => {
		// Only allow POST requests for resend
		if (request.method !== 'POST') {
			console.log(`[resend] Invalid request method: ${request.method}`);
			return fail(405, { error: 'Method not allowed' });
		}

		const formData = await request.formData();
		const email =
			url.searchParams.get('email') ||
			String(formData.get('email') ?? '')
				.trim()
				.toLowerCase();

		console.log(`[resend] Resend POST request for email: ${email}`);

		if (!email) {
			console.log(`[resend] No email provided`);
			return fail(400, { error: 'Email is required' });
		}

		try {
			// Check if user exists
			const [userRecord] = await db.select().from(user).where(eq(user.email, email));
			if (!userRecord) {
				console.log(`[resend] User not found: ${email}`);
				return fail(400, { error: 'User not found' });
			}

			// Check if already verified
			if (userRecord.emailVerified) {
				console.log(`[resend] Email already verified: ${email}`);
				return fail(400, { error: 'Email is already verified' });
			}

			// Check for recent resend attempts (rate limiting)
			const recentTokens = await db
				.select()
				.from(verificationToken)
				.where(eq(verificationToken.identifier, email));

			if (recentTokens.length > 0) {
				const latestToken = recentTokens[0];
				const timeSinceLastSent = Date.now() - latestToken.expires.getTime() + 10 * 60 * 1000; // 10 minutes
				const minResendInterval = 60 * 1000; // 1 minute minimum between resends

				if (timeSinceLastSent < minResendInterval) {
					console.log(`[resend] Rate limit exceeded for ${email}`);
					return fail(429, {
						error: 'Please wait at least 1 minute before requesting another code.'
					});
				}
			}

			// Generate new OTP
			const otp = Math.floor(100000 + Math.random() * 900000).toString();
			const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

			console.log(`[resend] Generating new OTP for ${email}: ${otp}`);

			// Clear any existing tokens for this email
			await db.delete(verificationToken).where(eq(verificationToken.identifier, email));

			// Insert new verification token
			await db.insert(verificationToken).values({
				identifier: email,
				token: otp,
				expires
			});

			// Send verification email
			try {
				await sendOtpEmail(email, otp);
				console.log(`[resend] New verification email sent successfully to ${email}`);
				return { success: 'Verification code sent successfully!' };
			} catch (emailError) {
				console.error('Failed to send verification email:', emailError);
				return fail(500, { error: 'Failed to send verification email' });
			}
		} catch (error) {
			console.error('Resend error:', error);
			return fail(500, { error: 'An error occurred while resending the code' });
		}
	}
};
