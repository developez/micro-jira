// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { PageServerLoad } from './$types';
import { getSiteName } from '$lib/server/site';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
    if (!locals.user) redirect(303, `${base}/login`);
    return { user: locals.user, site_name: getSiteName() };
};
