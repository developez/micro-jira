import { json } from '@sveltejs/kit';
import { e as jiraGetTransitions, b as buildJiraErrorMessage } from './jira-p2fuPwr_.js';
import 'axios';
import './shared-server-DaWdgxVh.js';

const GET = async ({ locals, url }) => {
  if (!locals.user) {
    return json({ ok: false, message: "no autenticado" }, { status: 401 });
  }
  const issue_key = url.searchParams.get("issue_key") || "";
  if (!issue_key.trim()) {
    return json({ ok: false, message: "issue_key es obligatorio" }, { status: 400 });
  }
  try {
    const data = await jiraGetTransitions({ issue_key });
    return json({ ok: true, data });
  } catch (error) {
    return json({ ok: false, message: buildJiraErrorMessage(error) }, { status: 400 });
  }
};

export { GET };
//# sourceMappingURL=_server.ts-B5lS4lSA.js.map
