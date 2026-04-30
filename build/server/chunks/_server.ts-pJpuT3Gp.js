import { json } from '@sveltejs/kit';
import { d as jiraAddComment, b as buildJiraErrorMessage } from './jira-p2fuPwr_.js';
import 'axios';
import './shared-server-DaWdgxVh.js';

const POST = async ({ locals, request }) => {
  if (!locals.user) {
    return json({ ok: false, message: "no autenticado" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const issue_key = String(body.issue_key || "").trim();
  const comment = String(body.comment || "").trim();
  if (!issue_key) return json({ ok: false, message: "issue_key es obligatorio" }, { status: 400 });
  if (!comment) return json({ ok: false, message: "comment es obligatorio" }, { status: 400 });
  try {
    const comment_with_user = `[${locals.user}]:

${comment}`;
    const data = await jiraAddComment({ issue_key, comment: comment_with_user });
    return json({ ok: true, data });
  } catch (error) {
    return json({ ok: false, message: buildJiraErrorMessage(error) }, { status: 400 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-pJpuT3Gp.js.map
