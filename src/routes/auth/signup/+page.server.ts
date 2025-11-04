import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db, user, verificationToken } from '$lib/db';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { sendOtpEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	// If user is already authenticated, redirect to appropriate page
	if (session?.user) {
		const role = (session.user as any).role || 'user';
		const dest = role === 'admin' ? '/dashboard' : '/dashboard';
		throw redirect(303, dest);
	}
};

export const actions: Actions = {
	register: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		// Debug logging
		console.log('[signup] Form data received:', {
			name: name ? 'provided' : 'missing',
			email: email ? 'provided' : 'missing',
			password: password ? 'provided' : 'missing'
		});

		// Validation
		if (!email || !password) {
			console.log('[signup] Missing required fields:', { email: !!email, password: !!password });
			return fail(400, {
				error: 'Missing required fields',
				message: 'Please fill in all required fields'
			});
		}

		if (password.length < 8) {
			return fail(400, {
				error: 'Password too short',
				message: 'Password must be at least 8 characters long'
			});
		}

		console.log(`[signup] Attempting to register user: ${email}`);
		console.log(`[signup] User table imported:`, !!user, typeof user);
		console.log(`[signup] Database connection:`, !!db);
		console.log(`[signup] VerificationToken imported:`, !!verificationToken);

		// Check if user already exists
		console.log(`[signup] Checking for existing user with email: ${email.toLowerCase()}`);
		const [existingUser] = await db.select().from(user).where(eq(user.email, email.toLowerCase()));
		console.log(
			`[signup] Existing user check result:`,
			existingUser ? 'User exists' : 'No existing user'
		);

		if (existingUser) {
			console.log(`[signup] User already exists: ${email}`);
			return fail(400, {
				error: 'User exists',
				message: 'An account with this email already exists'
			});
		}

		try {
			// Hash password
			console.log(`[signup] Hashing password for user: ${email}`);
			const hashedPassword = await hash(password, 12);

			// Create new user (email not verified yet)
			const newUser = {
				id: randomUUID(),
				name: name?.trim() || null,
				email: email.toLowerCase().trim(),
				hashedPassword,
				role: 'user',
				isActive: true,
				disabled: false,
				emailVerified: null // Explicitly set as not verified
			};

			console.log(`[signup] Creating new user with ID: ${newUser.id}`);
			await db.insert(user).values(newUser);
			console.log(`[signup] User created successfully: ${email}`);

			// Create verification token
			const otp = Math.floor(100000 + Math.random() * 900000).toString();
			const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

			console.log(`[signup] Creating verification token for ${email}: ${otp}`);

			// Clear any existing tokens for this email
			await db
				.delete(verificationToken)
				.where(eq(verificationToken.identifier, email.toLowerCase()));

			// Insert new verification token
			await db.insert(verificationToken).values({
				identifier: email.toLowerCase(),
				token: otp,
				expires
			});

			// Send verification email
			try {
				await sendOtpEmail(email, otp);
				console.log(`[signup] Verification email sent successfully to ${email}`);
			} catch (emailError) {
				console.error('Failed to send verification email:', emailError);
				// Don't fail the registration if email fails
			}
		} catch (error) {
			console.error('Registration error:', error);
			return fail(500, {
				error: 'Registration failed',
				message: 'An error occurred during registration. Please try again.'
			});
		}

		// Redirect to verification page (outside try-catch to avoid catching the redirect)
		const redirectUrl = `/auth/verify?email=${encodeURIComponent(email)}&sent=1`;
		console.log(`[signup] Redirecting to: ${redirectUrl}`);
		throw redirect(303, redirectUrl);
	}
};
