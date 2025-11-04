import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { user, verificationToken } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifyPasswordResetToken, markPasswordResetTokenAsUsed } from '$lib/utils/email';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const formData = await request.formData();
			const token = formData.get('token') as string;
			const password = formData.get('password') as string;
			const confirmPassword = formData.get('confirmPassword') as string;

			if (!token || !password) {
				return fail(400, { error: 'Token and password are required' });
			}

			if (password.length < 8) {
				return fail(400, { error: 'Password must be at least 8 characters long' });
			}

			if (password !== confirmPassword) {
				return fail(400, { error: 'Passwords do not match' });
			}

			// Verify the reset token
			const email = await verifyPasswordResetToken(token);

			if (!email) {
				return fail(400, { error: 'Invalid or expired reset token' });
			}

			// Hash the new password
			const hashedPassword = await bcrypt.hash(password, 12);

			// Update user's password
			await db.update(user).set({ hashedPassword }).where(eq(user.email, email));

			// Mark the reset token as used
			await markPasswordResetTokenAsUsed(token);

			return { success: 'Password updated successfully' };
		} catch (error) {
			console.error('Reset password error:', error);
			return fail(500, { error: 'An error occurred' });
		}
	}
};
