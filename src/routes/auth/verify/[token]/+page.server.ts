import { redirect } from '@sveltejs/kit';
import { verifyEmailToken } from '$lib/utils/email';
import { db } from '$lib/db';
import { user } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const email = await verifyEmailToken(params.token);

		if (!email) {
			throw redirect(302, '/auth/error?message=Invalid or expired verification token');
		}

		// Mark email as verified
		await db.update(user).set({ emailVerified: new Date() }).where(eq(user.email, email));

		throw redirect(302, '/auth/signup?verified=true');
	} catch (error) {
		if (error instanceof Response) {
			throw error;
		}
		console.error('Verification error:', error);
		throw redirect(302, '/auth/error?message=Verification failed');
	}
};
