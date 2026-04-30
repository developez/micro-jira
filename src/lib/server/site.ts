import { env } from '$env/dynamic/private';

export function getSiteName(): string {
    return (env.JIRA_NAME || 'micro-Jira').trim();
}
