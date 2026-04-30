import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jiraGetTransitions, buildJiraErrorMessage } from '$lib/server/jira';

export const GET: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) {
        return json({ ok: false, message: 'no autenticado' }, { status: 401 });
    }
    const issue_key = url.searchParams.get('issue_key') || '';
    if (!issue_key.trim()) {
        return json({ ok: false, message: 'issue_key es obligatorio' }, { status: 400 });
    }
    try {
        const data = await jiraGetTransitions({ issue_key });
        return json({ ok: true, data });
    } catch (error) {
        return json({ ok: false, message: buildJiraErrorMessage(error) }, { status: 400 });
    }
};
