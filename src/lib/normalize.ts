import { adfToPlainText } from './adf';

export type AttachmentItem = {
    attachment_id: string;
    file_name: string;
    content_url: string;
    thumbnail_url: string;
    mime_type: string;
};

export type CommentItem = {
    author_name: string;
    created_at: string;
    body_text: string;
};

function parseTaggedComment(raw_body_text: string, fallback_author_name: string): CommentItem {
    const body_text = String(raw_body_text || '');
    const first_line_break_idx = body_text.search(/\r?\n/);
    const first_line =
        first_line_break_idx === -1 ? body_text : body_text.slice(0, first_line_break_idx);
    const tagged_match = first_line.match(/^\[([^\]\r\n]+)\]:?\s*$/);

    if (!tagged_match) {
        return {
            author_name: fallback_author_name,
            created_at: '',
            body_text
        };
    }

    const tagged_author_name = tagged_match[1].trim();
    let remaining_body =
        first_line_break_idx === -1 ? '' : body_text.slice(first_line_break_idx).replace(/^\r?\n/, '');
    remaining_body = remaining_body.trimStart();

    return {
        author_name: tagged_author_name || fallback_author_name,
        created_at: '',
        body_text: remaining_body
    };
}

export type NormalizedIssue = {
    issue_key: string;
    is_epic: boolean;
    issue_type_name: string;
    issue_type_icon_url: string;
    parent_key: string | null;
    summary: string;
    assignee_name: string;
    reporter_name: string;
    priority_name: string;
    status_id: string;
    status_name: string;
    resolution_name: string;
    created_at: string;
    updated_at: string;
    due_date: string;
};

export type HierarchyResult = {
    issue_by_key: Record<string, NormalizedIssue>;
    children_by_parent_key: Record<string, string[]>;
    root_issue_keys: string[];
};

export type DetailState = {
    is_loading: boolean;
    is_loaded: boolean;
    error_text: string;
    description_html: string;
    attachment_items: AttachmentItem[];
    comment_items: CommentItem[];
    transitions: any[];
    selected_transition_id: string;
    comment_text: string;
};

function sanitizeUrl(raw_url: unknown): string {
    const safe = String(raw_url || '').trim();
    if (!safe) return '';
    if (safe.startsWith('http://') || safe.startsWith('https://')) return safe;
    return '';
}

function buildAttachmentProxyUrl(
    attachment_id: string,
    variant: 'content' | 'thumbnail',
    base_path: string = ''
): string {
    const safe_attachment_id = String(attachment_id || '').trim();
    if (!safe_attachment_id) return '';
    const safe_base_path = String(base_path || '').replace(/\/$/, '');
    const params = new URLSearchParams({
        attachment_id: safe_attachment_id,
        variant
    });
    return `${safe_base_path}/api/jira/attachment-content?${params.toString()}`;
}

function getParentIssueKey(issue_data: any): string | null {
    const fields = issue_data.fields || {};
    const parent_from_fields = fields.parent?.key || null;
    const parent_from_root = issue_data.parent?.key || null;
    const parent_from_epic_link =
        typeof fields.customfield_10014 === 'string' ? fields.customfield_10014 : null;
    return parent_from_fields || parent_from_root || parent_from_epic_link || null;
}

export function normalizeIssue(issue_data: any): NormalizedIssue {
    const fields = issue_data.fields || {};
    const issue_type_name = fields.issuetype?.name || '';
    const hierarchy_level = fields.issuetype?.hierarchyLevel;
    const normalized_type = String(issue_type_name).trim().toLowerCase();
    const is_epic =
        hierarchy_level === 1 ||
        normalized_type === 'epic' ||
        normalized_type === '\u00e9pica' ||
        normalized_type === 'epica';

    return {
        issue_key: issue_data.key || '-',
        is_epic,
        issue_type_name: issue_type_name || '-',
        issue_type_icon_url: sanitizeUrl(fields.issuetype?.iconUrl),
        parent_key: getParentIssueKey(issue_data),
        summary: fields.summary || '-',
        assignee_name: fields.assignee?.displayName || 'Sin asignar',
        reporter_name: fields.reporter?.displayName || '-',
        priority_name: fields.priority?.name || '-',
        status_id: String(fields.status?.id || ''),
        status_name: fields.status?.name || '-',
        resolution_name: fields.resolution?.name || 'Sin resolver',
        created_at: fields.created || '',
        updated_at: fields.updated || '',
        due_date: fields.duedate || 'Ninguno'
    };
}

function getEpicAncestorKey(
    issue: NormalizedIssue,
    ibk: Record<string, NormalizedIssue>
): string | null {
    const visited = new Set<string>();
    let parent_key = issue.parent_key;

    while (parent_key && ibk[parent_key]) {
        if (visited.has(parent_key)) return null;
        visited.add(parent_key);
        const parent = ibk[parent_key];
        if (!parent) return null;
        if (parent.is_epic) return parent.issue_key;
        parent_key = parent.parent_key;
    }

    return null;
}

export function rebuildHierarchy(issues: NormalizedIssue[]): HierarchyResult {
    const issue_by_key: Record<string, NormalizedIssue> = {};
    const children_by_parent_key: Record<string, string[]> = {};
    const root_issue_keys: string[] = [];

    for (const issue of issues) {
        issue_by_key[issue.issue_key] = issue;
    }

    for (const issue of issues) {
        if (!issue.is_epic) continue;
        root_issue_keys.push(issue.issue_key);
        children_by_parent_key[issue.issue_key] = [];
    }

    for (const issue of issues) {
        if (issue.is_epic) continue;
        const epic_key = getEpicAncestorKey(issue, issue_by_key);
        if (!epic_key || !children_by_parent_key[epic_key]) continue;
        children_by_parent_key[epic_key].push(issue.issue_key);
    }

    if (root_issue_keys.length === 0) {
        for (const issue of issues) {
            if (issue.parent_key) continue;
            root_issue_keys.push(issue.issue_key);
            children_by_parent_key[issue.issue_key] = [];
        }
    }

    return { issue_by_key, children_by_parent_key, root_issue_keys };
}

export function getStatusClass(status_name: string, status_id: string = ''): string {
    const sid = String(status_id || '').trim();
    if (sid === '10001') return 'status_10001';
    if (sid === '10002') return 'status_10002';
    if (sid === '10003') return 'status_10003';

    const s = String(status_name || '').toLowerCase();
    if (s.includes('done') || s.includes('hecho') || s.includes('cerr')) return 'status_done';
    if (s.includes('progress') || s.includes('proceso') || s.includes('curso')) return 'status_progress';
    return 'status_pending';
}

export function getPriorityClass(priority_name: string): string {
    const p = String(priority_name || '').trim().toLowerCase();
    if (p === 'highest' || p === 'high') return 'priority_high';
    if (p === 'medium') return 'priority_medium';
    if (p === 'lowest' || p === 'low') return 'priority_low';
    return 'priority_medium';
}

export function formatDateText(value_text: string): string {
    if (!value_text || value_text === 'Ninguno') return 'Ninguno';
    const date_obj = new Date(value_text);
    if (Number.isNaN(date_obj.getTime())) return value_text;
    return date_obj.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function extractAttachmentItems(detail_payload: any, base_path: string = ''): AttachmentItem[] {
    const raw = Array.isArray(detail_payload?.fields?.attachment)
        ? detail_payload.fields.attachment
        : [];
    return raw.map((a: any) => ({
        attachment_id: String(a?.id || ''),
        file_name: String(a?.filename || ''),
        content_url: String(a?.id || '').trim()
            ? buildAttachmentProxyUrl(String(a?.id || ''), 'content', base_path)
            : sanitizeUrl(a?.content),
        thumbnail_url: String(a?.id || '').trim()
            ? buildAttachmentProxyUrl(String(a?.id || ''), 'thumbnail', base_path)
            : sanitizeUrl(a?.thumbnail),
        mime_type: String(a?.mimeType || '')
    }));
}

export function extractCommentItems(detail_payload: any): CommentItem[] {
    const raw = Array.isArray(detail_payload?.fields?.comment?.comments)
        ? detail_payload.fields.comment.comments
        : [];
    return raw.map((c: any) => {
        const jira_author_name = c?.author?.displayName || 'Sistema';
        const parsed = parseTaggedComment(adfToPlainText(c?.body ?? null), jira_author_name);
        return {
            author_name: parsed.author_name,
            created_at: c?.created || '',
            body_text: parsed.body_text
        };
    });
}

export function findDoneTransition(transitions: any[]): any | null {
    for (const t of transitions) {
        const name = String(t?.name || '').trim().toLowerCase();
        const to_name = String(t?.to?.name || '').trim().toLowerCase();
        const is_done =
            name.includes('terminar') ||
            name.includes('done') ||
            name.includes('finish') ||
            to_name.includes('hecho') ||
            to_name.includes('done');
        if (is_done) return t;
    }
    return null;
}

export function getDefaultDetailState(): DetailState {
    return {
        is_loading: false,
        is_loaded: false,
        error_text: '',
        description_html: '',
        attachment_items: [],
        comment_items: [],
        transitions: [],
        selected_transition_id: '',
        comment_text: ''
    };
}
