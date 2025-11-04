import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const session = await locals.auth();

	if (!session?.user) {
		throw redirect(302, '/auth/login');
	}

	return {
		user: {
			id: session.user.id,
			name: session.user.name,
			email: session.user.email,
			image: session.user.image,
			role: (session.user as any).role || 'user'
		}
	};
}
