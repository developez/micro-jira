import { json } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
    cookies.delete('session', { path: base || '/' });
    return json({ ok: true });
};
