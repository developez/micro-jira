import { readFileSync } from 'fs';
import { createHmac } from 'crypto';
import { resolve } from 'path';
import { env } from '$env/dynamic/private';

function getCredentialsPath(): string {
    const cred_file = (env.CREDENTIALS_FILE || 'users.credentials').trim();
    if (cred_file.startsWith('/') || /^[A-Za-z]:[/\\]/.test(cred_file)) {
        return cred_file;
    }
    return resolve(process.cwd(), cred_file);
}

function getSessionSecret(): string {
    return env.SESSION_SECRET || 'dev_secret_change_in_production';
}

type UserAccess = {
    username: string;
    jira_user_id: string;
    allowed_status_ids: string[];
};

type CredentialsRecord = {
    username: string;
    password: string;
    jira_user_id: string;
    allowed_status_ids: string[];
    alias: string;
};

function parseStatusIds(raw_status_ids: string): string[] {
    return raw_status_ids
        .split(',')
        .map((value) => value.trim())
        .filter((value) => /^\d+$/.test(value));
}

function parseCredentialsLine(line: string): CredentialsRecord | null {
    const semicolon_parts = line.split(';').map((part) => part.trim());
    if (semicolon_parts.length >= 4) {
        const username = semicolon_parts[0];
        const password = semicolon_parts[1];
        const jira_user_id = semicolon_parts[2];
        const allowed_status_ids = parseStatusIds(semicolon_parts[3] || '');
        const alias = semicolon_parts[4] || '';
        if (!username || !password || !jira_user_id || allowed_status_ids.length === 0) {
            return null;
        }
        return { username, password, jira_user_id, allowed_status_ids, alias };
    }

    // compatibilidad temporal con formato antiguo usuario:clave
    const colon_idx = line.indexOf(':');
    if (colon_idx === -1) return null;
    const username = line.slice(0, colon_idx).trim();
    const password = line.slice(colon_idx + 1).trim();
    if (!username || !password) return null;
    return { username, password, jira_user_id: username, allowed_status_ids: [], alias: '' };
}

function loadCredentialsRecords(): CredentialsRecord[] {
    const records: CredentialsRecord[] = [];
    try {
        const content = readFileSync(getCredentialsPath(), 'utf-8');
        for (const raw_line of content.split('\n')) {
            const line = raw_line.trim();
            if (!line || line.startsWith('#')) continue;
            const record = parseCredentialsLine(line);
            if (record) records.push(record);
        }
    } catch {
        // fichero no encontrado o sin permisos
    }
    return records;
}

export function validateCredentials(username: string, password: string): boolean {
    const canonical_username = resolveCanonicalUsername(username, password);
    return canonical_username !== null;
}

export function resolveCanonicalUsername(login_user: string, password: string): string | null {
    const records = loadCredentialsRecords();
    const found = records.find((record) => {
        if (record.password !== password) return false;
        return record.username === login_user || (!!record.alias && record.alias === login_user);
    });
    return found?.username || null;
}

export function getUserAccess(username: string): UserAccess | null {
    const records = loadCredentialsRecords();
    const found = records.find((record) => record.username === username);
    if (!found) return null;
    return {
        username: found.username,
        jira_user_id: found.jira_user_id,
        allowed_status_ids: found.allowed_status_ids
    };
}

export function buildTasksJqlForUser(user_access: UserAccess): string {
    if (user_access.allowed_status_ids.length === 0) {
        throw new Error('el usuario no tiene estados permitidos configurados');
    }
    const statuses = user_access.allowed_status_ids.join(',');
    if (user_access.jira_user_id.trim().toLowerCase() === 'all') {
        return `status in (${statuses})`;
    }
    return `assignee = "${user_access.jira_user_id}" AND status in (${statuses})`;
}

export function createSessionCookie(username: string): string {
    const secret = getSessionSecret();
    const payload = Buffer.from(username).toString('base64url');
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    return `${payload}.${sig}`;
}

export function verifySessionCookie(cookie: string): string | null {
    try {
        const dot_idx = cookie.lastIndexOf('.');
        if (dot_idx === -1) return null;
        const payload = cookie.slice(0, dot_idx);
        const sig = cookie.slice(dot_idx + 1);
        const secret = getSessionSecret();
        const expected_sig = createHmac('sha256', secret).update(payload).digest('hex');
        if (sig !== expected_sig) return null;
        return Buffer.from(payload, 'base64url').toString('utf-8');
    } catch {
        return null;
    }
}
