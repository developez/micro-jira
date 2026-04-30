export function escapeHtml(raw_text: unknown): string {
    return String(raw_text ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function sanitizeUrl(raw_url: unknown): string {
    const safe_url = String(raw_url || '').trim();
    if (!safe_url) return '';
    if (safe_url.startsWith('http://') || safe_url.startsWith('https://')) return safe_url;
    return '';
}

function normalizeFileName(file_name: unknown): string {
    return String(file_name || '').trim().toLowerCase();
}

type AttachmentLike = {
    attachment_id: string;
    file_name: string;
    content_url: string;
    thumbnail_url: string;
};

function resolveMediaUrl(media_attrs: any, attachment_items: AttachmentLike[]): string {
    const media_id = String(media_attrs?.id || '');
    const media_alt = String(media_attrs?.alt || '');
    const normalized_alt = normalizeFileName(media_alt);

    if (media_id) {
        const by_id = attachment_items.find(
            (a) => String(a.attachment_id || '') === media_id
        );
        if (by_id && (by_id.content_url || by_id.thumbnail_url)) {
            return by_id.content_url || by_id.thumbnail_url;
        }
    }

    if (normalized_alt) {
        const by_name = attachment_items.find(
            (a) => normalizeFileName(a.file_name) === normalized_alt
        );
        if (by_name && (by_name.content_url || by_name.thumbnail_url)) {
            return by_name.content_url || by_name.thumbnail_url;
        }
    }

    return '';
}

function applyTextMarks(text_html: string, marks: any[]): string {
    if (!Array.isArray(marks) || marks.length === 0) return text_html;
    return marks.reduce((current_html: string, mark_item: any) => {
        const mark_type = mark_item?.type || '';
        if (mark_type === 'strong') return `<strong>${current_html}</strong>`;
        if (mark_type === 'em') return `<em>${current_html}</em>`;
        if (mark_type === 'underline') return `<u>${current_html}</u>`;
        if (mark_type === 'code') return `<code>${current_html}</code>`;
        if (mark_type === 'link') {
            const href = sanitizeUrl(mark_item?.attrs?.href);
            if (!href) return current_html;
            return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${current_html}</a>`;
        }
        return current_html;
    }, text_html);
}

function adfNodeToText(adf_node: unknown): string {
    if (adf_node == null) return '';
    if (Array.isArray(adf_node)) return adf_node.map(adfNodeToText).join('');
    if (typeof adf_node !== 'object') return '';

    const node = adf_node as any;
    const node_type = node.type || '';

    if (node_type === 'text') return node.text || '';
    if (node_type === 'hardBreak') return '\n';

    const content_text = Array.isArray(node.content)
        ? node.content.map(adfNodeToText).join('')
        : '';

    if (node_type === 'paragraph' || node_type === 'heading') return content_text + '\n';
    if (node_type === 'listItem') {
        const item_text = content_text.trim();
        return item_text ? `- ${item_text}\n` : '';
    }
    if (node_type === 'bulletList' || node_type === 'orderedList') return content_text + '\n';
    if (node_type === 'taskItem') {
        const item_text = content_text.trim();
        return item_text ? `- ${item_text}\n` : '';
    }
    if (node_type === 'taskList') return content_text + '\n';

    return content_text;
}

export function adfToPlainText(adf_doc: unknown): string {
    const raw_text = adfNodeToText(adf_doc);
    return raw_text.replace(/\n{3,}/g, '\n\n').trim();
}

type RenderContext = { attachment_items: AttachmentLike[] };

function adfNodesToHtml(adf_nodes: unknown, ctx: RenderContext): string {
    if (!Array.isArray(adf_nodes)) return '';
    return adf_nodes.map((child) => adfNodeToHtml(child, ctx)).join('');
}

function adfNodeToHtml(adf_node: unknown, ctx: RenderContext): string {
    if (adf_node == null || typeof adf_node !== 'object') return '';

    const node = adf_node as any;
    const node_type = node.type || '';
    const child_html = adfNodesToHtml(node.content, ctx);

    if (node_type === 'text') {
        const base_html = escapeHtml(node.text || '');
        return applyTextMarks(base_html, node.marks);
    }
    if (node_type === 'hardBreak') return '<br>';
    if (node_type === 'paragraph') {
        return child_html.trim() ? `<p>${child_html}</p>` : '<p></p>';
    }
    if (node_type === 'heading') {
        const lvl = Math.min(Math.max(Number(node?.attrs?.level) || 2, 1), 6);
        return `<h${lvl}>${child_html}</h${lvl}>`;
    }
    if (node_type === 'bulletList') return `<ul>${child_html}</ul>`;
    if (node_type === 'orderedList') return `<ol>${child_html}</ol>`;
    if (node_type === 'listItem') return `<li>${child_html}</li>`;
    if (node_type === 'taskList') return `<ul class="adf_task_list">${child_html}</ul>`;
    if (node_type === 'taskItem') {
        const state = String(node?.attrs?.state || '').toUpperCase();
        const state_prefix = state === 'DONE' ? '[x] ' : '[ ] ';
        const safe_prefix = `<span class="adf_task_state">${escapeHtml(state_prefix)}</span>`;
        return `<li class="adf_task_item">${safe_prefix}${child_html}</li>`;
    }
    if (node_type === 'blockquote') return `<blockquote>${child_html}</blockquote>`;
    if (node_type === 'rule') return '<hr>';
    if (node_type === 'codeBlock') {
        return `<pre><code>${escapeHtml(adfNodeToText(node))}</code></pre>`;
    }
    if (node_type === 'mediaSingle') {
        return `<div class="adf_media_single">${child_html}</div>`;
    }
    if (node_type === 'media') {
        const media_attrs = node.attrs || {};
        const media_type = String(media_attrs.type || '').toLowerCase();
        const media_alt = String(media_attrs.alt || '');
        const media_id = String(media_attrs.id || '');
        const media_url = resolveMediaUrl(media_attrs, ctx.attachment_items);
        const alt_text = media_alt || 'jira-media';

        if (media_type === 'file' && media_url) {
            return `<img class="adf_image" src="${escapeHtml(media_url)}" alt="${escapeHtml(alt_text)}" loading="lazy">`;
        }
        return `<div class="adf_media_fallback">Imagen no resuelta (id: ${escapeHtml(media_id || '-')}, alt: ${escapeHtml(alt_text || '-')})</div>`;
    }

    return child_html;
}

export function adfToHtml(
    adf_doc: unknown,
    ctx: RenderContext = { attachment_items: [] }
): string {
    if (!adf_doc) return '';
    return adfNodeToHtml(adf_doc, ctx);
}
