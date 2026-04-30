import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jiraAddComment, buildJiraErrorMessage } from '$lib/server/jira';

export const POST: RequestHandler = async ({ locals, request }) => {
    if (!locals.user) {
        return json({ ok: false, message: 'no autenticado' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const issue_key = String(body.issue_key || '').trim();
    const comment = String(body.comment || '').trim();
    if (!issue_key) return json({ ok: false, message: 'issue_key es obligatorio' }, { status: 400 });
    if (!comment) return json({ ok: false, message: 'comment es obligatorio' }, { status: 400 });
    try {
        const comment_with_user = `[${locals.user}]:\n\n${comment}`;
        const data = await jiraAddComment({ issue_key, comment: comment_with_user });
        return json({ ok: true, data });
    } catch (error) {
        return json({ ok: false, message: buildJiraErrorMessage(error) }, { status: 400 });
    }
};
