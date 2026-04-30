import { json } from '@sveltejs/kit';
import { c as jiraChangeStatus, b as buildJiraErrorMessage } from './jira-p2fuPwr_.js';
import 'axios';
import './shared-server-DaWdgxVh.js';

const POST = async ({ locals, request }) => {
  if (!locals.user) {
    return json({ ok: false, message: "no autenticado" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const issue_key = String(body.issue_key || "").trim();
  if (!issue_key) return json({ ok: false, message: "issue_key es obligatorio" }, { status: 400 });
  try {
    const data = await jiraChangeStatus({
      issue_key,
      transition_id: body.transition_id || null,
      to_status: body.to_status || null,
      comment: body.comment || null
    });
    return json({ ok: true, data });
  } catch (error) {
    return json({ ok: false, message: buildJiraErrorMessage(error) }, { status: 400 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-CIGa7MGG.js.map
