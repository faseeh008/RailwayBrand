import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	if (session?.user) {
		// User is logged in, redirect to signout endpoint
		throw redirect(303, '/auth/signout');
	} else {
		// User is not logged in, redirect to login
		throw redirect(303, '/auth/login');
	}
};
