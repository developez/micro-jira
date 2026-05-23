import { redirect, fail } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { resolveCanonicalUsername, createSessionCookie } from '$lib/server/auth';
import { getSiteName } from '$lib/server/site';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) redirect(303, `${base}/`);
    return { site_name: getSiteName() };
};

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const form_data = await request.formData();
        const username = String(form_data.get('username') || '').trim();
        const password = String(form_data.get('password') || '');

        if (!username || !password) {
            return fail(400, { message: 'usuario y contraseña son obligatorios' });
        }

        const canonical_username = resolveCanonicalUsername(username, password);
        if (!canonical_username) {
            return fail(401, { message: 'credenciales incorrectas' });
        }

        const session_value = createSessionCookie(canonical_username);
        cookies.set('session', session_value, {
            path: base || '/',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 8
        });

        redirect(303, `${base}/`);
    }
};
