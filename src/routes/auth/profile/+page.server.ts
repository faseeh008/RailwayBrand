import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { user } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';

export async function load({ locals }) {
	const session = await locals.auth();

	if (!session?.user) {
		throw redirect(302, '/auth/login');
	}

	const [userRecord] = await db.select().from(user).where(eq(user.id, session.user.id));

	return {
		user: userRecord
	};
}

export const actions = {
	updateProfile: async ({ request, locals }) => {
		try {
			const session = await locals.auth();

			if (!session?.user) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await request.formData();
			const name = String(formData.get('name') ?? '').trim();

			if (!name) {
				return fail(400, { message: 'Name is required' });
			}

			// Only update the name field, email remains unchanged
			await db.update(user).set({ name }).where(eq(user.id, session.user.id));

			// Return the updated user data
			const [updatedUser] = await db.select().from(user).where(eq(user.id, session.user.id));

			return {
				success: 'Profile updated successfully',
				user: updatedUser
			};
		} catch (error) {
			console.error('Profile update error:', error);
			return fail(500, { message: 'An error occurred while updating your profile' });
		}
	},

	changePassword: async ({ request, locals }) => {
		try {
			const session = await locals.auth();

			if (!session?.user) {
				return fail(401, { message: 'Unauthorized' });
			}

			const formData = await request.formData();
			const currentPassword = String(formData.get('currentPassword') ?? '');
			const newPassword = String(formData.get('newPassword') ?? '');
			const confirmPassword = String(formData.get('confirmPassword') ?? '');

			if (!currentPassword || !newPassword || !confirmPassword) {
				return fail(400, { message: 'All password fields are required' });
			}

			if (newPassword !== confirmPassword) {
				return fail(400, { message: 'New passwords do not match' });
			}

			if (newPassword.length < 6) {
				return fail(400, { message: 'New password must be at least 6 characters long' });
			}

			// Get current user
			const [userRecord] = await db.select().from(user).where(eq(user.id, session.user.id));
			if (!userRecord || !userRecord.hashedPassword) {
				return fail(400, { message: 'User not found or no password set' });
			}

			// Verify current password
			const validPassword = await compare(currentPassword, userRecord.hashedPassword);
			if (!validPassword) {
				return fail(400, { message: 'Current password is incorrect' });
			}

			// Hash new password
			const hashedNewPassword = await hash(newPassword, 12);

			// Update password
			await db
				.update(user)
				.set({ hashedPassword: hashedNewPassword })
				.where(eq(user.id, session.user.id));

			return { success: 'Password changed successfully' };
		} catch (error) {
			console.error('Password change error:', error);
			return fail(500, { message: 'An error occurred while changing your password' });
		}
	}
};
