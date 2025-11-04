import { redirect } from '@sveltejs/kit';
import { signOut } from '$lib/auth';

export async function POST({ request, cookies }) {
	await signOut({ request, cookies, redirectTo: '/auth/login' });
	throw redirect(302, '/auth/login');
}

export async function GET({ cookies }) {
	// For GET requests, we'll just clear the session cookie and redirect
	cookies.delete('authjs.session-token', { path: '/' });
	cookies.delete('authjs.callback-url', { path: '/' });
	cookies.delete('authjs.csrf-token', { path: '/' });
	throw redirect(302, '/auth/login');
}
