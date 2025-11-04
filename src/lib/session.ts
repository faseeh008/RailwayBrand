import { db } from '$lib/db';
import { user } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserFromSession(cookies: any) {
	const userId = cookies.get('user_id');
	if (!userId) {
		return null;
	}

	try {
		const userRecord = await db.query.user.findFirst({
			where: eq(user.id, userId)
		});
		return userRecord;
	} catch (error) {
		console.error('Error fetching user from session:', error);
		return null;
	}
}

export function clearSession(cookies: any) {
	cookies.delete('user_id', { path: '/' });
}
