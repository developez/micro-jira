import { json } from "@sveltejs/kit";
import { a as jiraGetTaskDetail, b as buildJiraErrorMessage } from "../../../../../chunks/jira.js";
const GET = async ({ locals, url }) => {
  if (!locals.user) {
    return json({ ok: false, message: "no autenticado" }, { status: 401 });
  }
  const issue_key = url.searchParams.get("issue_key") || "";
  if (!issue_key.trim()) {
    return json({ ok: false, message: "issue_key es obligatorio" }, { status: 400 });
  }
  try {
    const data = await jiraGetTaskDetail({
      issue_key,
      include_description: url.searchParams.get("include_description")
    });
    return json({ ok: true, data });
  } catch (error) {
    return json({ ok: false, message: buildJiraErrorMessage(error) }, { status: 400 });
  }
};
export {
  GET
};
