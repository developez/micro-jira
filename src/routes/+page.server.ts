import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { PageServerLoad } from './$types';
import { getSiteName } from '$lib/server/site';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(303, `${base}/login`);
    return { user: locals.user, site_name: getSiteName() };
};
