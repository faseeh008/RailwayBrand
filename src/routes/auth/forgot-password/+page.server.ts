import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { user } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '$lib/utils/email';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const formData = await request.formData();
			const email = formData.get('email') as string;

			if (!email) {
				return fail(400, { error: 'Email is required' });
			}

			// Check if user exists
			const userRecord = await db.query.user.findFirst({
				where: eq(user.email, email)
			});

			if (!userRecord) {
				// Don't reveal if user exists or not
				return { success: 'If an account with that email exists, we sent a password reset link.' };
			}

			// Send password reset email
			await sendPasswordResetEmail(email);

			return { success: 'If an account with that email exists, we sent a password reset link.' };
		} catch (error) {
			console.error('Forgot password error:', error);
			return fail(500, { error: 'An error occurred' });
		}
	}
};
