import type { Handle } from '@sveltejs/kit';
import { verifySessionCookie } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
    const session_cookie = event.cookies.get('session');
    event.locals.user = session_cookie ? verifySessionCookie(session_cookie) : null;
    return resolve(event);
};
