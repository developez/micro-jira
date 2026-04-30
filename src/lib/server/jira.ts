import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { env } from '$env/dynamic/private';

type JiraConfig = {
    jira_base_url: string;
    jira_email_token: string;
    jira_token: string;
    jira_project_key: string;
};

function getJiraConfig(): JiraConfig {
    const jira_base_url = (env.JIRA_BASE_URL || 'https://config_yours.atlassian.net').replace(/\/$/, '');
    const jira_email_token = env.JIRA_EMAIL_TOKEN || env.EMAIL_TOKEN || '';
    const jira_token = env.JIRA_TOKEN || '';
    const jira_project_key = env.JIRA_PROJECT_KEY || 'KAN';
    return { jira_base_url, jira_email_token, jira_token, jira_project_key };
}

function createJiraClient(jira_config: JiraConfig): AxiosInstance {
    const auth_token = Buffer.from(`${jira_config.jira_email_token}:${jira_config.jira_token}`).toString('base64');
    return axios.create({
        baseURL: jira_config.jira_base_url,
        headers: {
            Authorization: `Basic ${auth_token}`,
            Accept: 'application/json'
        }
    });
}

function parseIntParam(value: unknown, default_value: number, min_value: number, max_value: number): number {
    const num_value = Number(value);
    if (!isFinite(num_value)) return default_value;
    const int_value = Math.floor(num_value);
    if (int_value < min_value) return min_value;
    if (int_value > max_value) return max_value;
    return int_value;
}

function parseBooleanParam(value: unknown, default_value: boolean): boolean {
    if (value == null) return default_value;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true;
    if (normalized === '0' || normalized === 'false' || normalized === 'no') return false;
    return default_value;
}

function stripJqlOrderBy(jql: string): string {
    return jql.replace(/\s+ORDER\s+BY\s+.+$/i, '').trim();
}

function buildRankedProjectJql(project_key: string, filter_jql: string): string {
    const clean_filter_jql = stripJqlOrderBy(filter_jql);
    const project_jql = `project = ${project_key}`;
    const scoped_jql = clean_filter_jql
        ? `${project_jql} AND (${clean_filter_jql})`
        : project_jql;
    return `${scoped_jql} ORDER BY Rank ASC`;
}

export function buildJiraErrorMessage(error: unknown): string {
    const axios_error = error as AxiosError;
    const data: any = axios_error?.response?.data;
    if (data && Array.isArray(data.errorMessages) && data.errorMessages.length > 0) {
        return data.errorMessages.join(' | ');
    }
    if (data && data.errors && typeof data.errors === 'object') {
        const errors_text = Object.keys(data.errors)
            .map((key) => `${key}: ${data.errors[key]}`)
            .join(' | ');
        if (errors_text) return errors_text;
    }
    if (data && typeof data === 'string') return data;
    return (error as Error)?.message || 'Jira request error';
}

export function buildAdfText(text: string): unknown {
    return {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
    };
}

async function requestJira(client: AxiosInstance, config: AxiosRequestConfig): Promise<unknown> {
    const response = await client.request(config);
    return response.data;
}

export type JiraAttachmentVariant = 'content' | 'thumbnail';

export type JiraAttachmentData = {
    content_buffer: Uint8Array;
    content_type: string;
    cache_control: string;
    content_length: number;
    etag: string;
    last_modified: string;
};

function resolveAttachmentUrl(attachment_id: string, variant: JiraAttachmentVariant): string {
    const encoded_attachment_id = encodeURIComponent(attachment_id);
    if (variant === 'thumbnail') return `/rest/api/3/attachment/thumbnail/${encoded_attachment_id}`;
    return `/rest/api/3/attachment/content/${encoded_attachment_id}`;
}

function getHeaderText(headers: Record<string, unknown> | undefined, key: string): string {
    if (!headers) return '';
    const raw = headers[key];
    if (raw == null) return '';
    return String(raw).trim();
}

function requireJiraConfig(): { config: JiraConfig; client: AxiosInstance } {
    const config = getJiraConfig();
    if (!config.jira_email_token || !config.jira_token) {
        throw new Error('faltan JIRA_EMAIL_TOKEN/EMAIL_TOKEN o JIRA_TOKEN en variables de entorno');
    }
    return { config, client: createJiraClient(config) };
}

export async function jiraGetTasks(params: {
    jql?: string | null;
    start_at?: string | null;
    max_results?: string | null;
    include_description?: string | null;
}): Promise<unknown> {
    const { config, client } = requireJiraConfig();
    const jql = buildRankedProjectJql(config.jira_project_key, params.jql || '');
    const start_at = parseIntParam(params.start_at, 0, 0, 1000000);
    const max_results = parseIntParam(params.max_results, 50, 1, 100);
    const include_description = parseBooleanParam(params.include_description, true);
    const fields = include_description ? '*all' : '*all,-description';
    return requestJira(client, {
        method: 'GET',
        url: '/rest/api/3/search/jql',
        params: { jql, startAt: start_at, maxResults: max_results, fields }
    });
}

export async function jiraGetTaskDetail(params: {
    issue_key: string;
    include_description?: string | null;
}): Promise<unknown> {
    const { client } = requireJiraConfig();
    const issue_key = params.issue_key.trim();
    if (!issue_key) throw new Error('issue_key es obligatorio');
    const include_description = parseBooleanParam(params.include_description, true);
    const fields = include_description ? '*all' : '*all,-description';
    return requestJira(client, {
        method: 'GET',
        url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}`,
        params: { fields }
    });
}

export async function jiraGetTransitions(params: { issue_key: string }): Promise<unknown> {
    const { client } = requireJiraConfig();
    const issue_key = params.issue_key.trim();
    if (!issue_key) throw new Error('issue_key es obligatorio');
    return requestJira(client, {
        method: 'GET',
        url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/transitions`
    });
}

export async function jiraAddComment(params: {
    issue_key: string;
    comment: string;
}): Promise<unknown> {
    const { client } = requireJiraConfig();
    const issue_key = params.issue_key.trim();
    if (!issue_key) throw new Error('issue_key es obligatorio');
    const comment = params.comment.trim();
    if (!comment) throw new Error('comment es obligatorio');
    return requestJira(client, {
        method: 'POST',
        url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/comment`,
        headers: { 'Content-Type': 'application/json' },
        data: { body: buildAdfText(comment) }
    });
}

export async function jiraChangeStatus(params: {
    issue_key: string;
    transition_id?: string | null;
    to_status?: string | null;
    comment?: string | null;
}): Promise<unknown> {
    const { client } = requireJiraConfig();
    const issue_key = params.issue_key.trim();
    if (!issue_key) throw new Error('issue_key es obligatorio');

    let transition_id = (params.transition_id || '').trim();
    const to_status = (params.to_status || '').trim();

    if (!transition_id && !to_status) {
        throw new Error('debes enviar transition_id o to_status');
    }

    let transitions_data: any = null;

    if (!transition_id && to_status) {
        transitions_data = await requestJira(client, {
            method: 'GET',
            url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/transitions`
        });
        const transitions: any[] = Array.isArray((transitions_data as any)?.transitions)
            ? (transitions_data as any).transitions
            : [];
        const found = transitions.find(
            (t: any) =>
                (t?.name || '').toString().trim().toLowerCase() === to_status.toLowerCase()
        );
        if (!found) {
            throw new Error('to_status no encontrado entre transiciones disponibles');
        }
        transition_id = String(found.id || '');
    }

    await requestJira(client, {
        method: 'POST',
        url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/transitions`,
        headers: { 'Content-Type': 'application/json' },
        data: { transition: { id: transition_id } }
    });

    const comment = (params.comment || '').trim();
    if (comment) {
        await requestJira(client, {
            method: 'POST',
            url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/comment`,
            headers: { 'Content-Type': 'application/json' },
            data: { body: buildAdfText(comment) }
        });
    }

    if (!transitions_data) {
        transitions_data = await requestJira(client, {
            method: 'GET',
            url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/transitions`
        });
    }

    return {
        issue_key,
        transition_id,
        next_available_transitions: (transitions_data as any)?.transitions || []
    };
}

export async function jiraGetAttachmentData(params: {
    attachment_id: string;
    variant?: JiraAttachmentVariant;
}): Promise<JiraAttachmentData> {
    const { client } = requireJiraConfig();
    const attachment_id = String(params.attachment_id || '').trim();
    if (!attachment_id) throw new Error('attachment_id es obligatorio');

    const variant: JiraAttachmentVariant =
        params.variant === 'thumbnail' ? 'thumbnail' : 'content';

    const response = await client.request<ArrayBuffer>({
        method: 'GET',
        url: resolveAttachmentUrl(attachment_id, variant),
        responseType: 'arraybuffer',
        headers: { Accept: '*/*' }
    });

    const response_headers = (response.headers || {}) as Record<string, unknown>;
    const content_buffer = new Uint8Array(response.data);
    const content_type = getHeaderText(response_headers, 'content-type') || 'application/octet-stream';
    const cache_control = getHeaderText(response_headers, 'cache-control');
    const etag = getHeaderText(response_headers, 'etag');
    const last_modified = getHeaderText(response_headers, 'last-modified');
    const length_from_header = Number(getHeaderText(response_headers, 'content-length') || '0');
    const content_length =
        Number.isFinite(length_from_header) && length_from_header > 0
            ? Math.floor(length_from_header)
            : content_buffer.byteLength;

    return {
        content_buffer,
        content_type,
        cache_control,
        content_length,
        etag,
        last_modified
    };
}
