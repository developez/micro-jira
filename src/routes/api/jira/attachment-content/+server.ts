import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
    jiraGetAttachmentData,
    buildJiraErrorMessage,
    type JiraAttachmentVariant
} from '$lib/server/jira';

function normalizeVariant(raw_variant: string): JiraAttachmentVariant | null {
    const normalized = raw_variant.trim().toLowerCase();
    if (!normalized || normalized === 'content') return 'content';
    if (normalized === 'thumbnail') return 'thumbnail';
    return null;
}

export const GET: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) {
        return json({ ok: false, message: 'no autenticado' }, { status: 401 });
    }

    const attachment_id = String(url.searchParams.get('attachment_id') || '').trim();
    if (!attachment_id) {
        return json({ ok: false, message: 'attachment_id es obligatorio' }, { status: 400 });
    }
    if (!/^\d+$/.test(attachment_id)) {
        return json({ ok: false, message: 'attachment_id invalido' }, { status: 400 });
    }

    const variant = normalizeVariant(String(url.searchParams.get('variant') || ''));
    if (!variant) {
        return json(
            { ok: false, message: "variant invalido; usa 'content' o 'thumbnail'" },
            { status: 400 }
        );
    }

    try {
        const data = await jiraGetAttachmentData({ attachment_id, variant });
        const headers = new Headers();
        headers.set('Content-Type', data.content_type || 'application/octet-stream');
        headers.set('Content-Length', String(data.content_length));
        if (data.cache_control) headers.set('Cache-Control', data.cache_control);
        else headers.set('Cache-Control', 'private, max-age=60');
        if (data.etag) headers.set('ETag', data.etag);
        if (data.last_modified) headers.set('Last-Modified', data.last_modified);
        return new Response(data.content_buffer, { status: 200, headers });
    } catch (error) {
        return json({ ok: false, message: buildJiraErrorMessage(error) }, { status: 400 });
    }
};
