import { json } from "@sveltejs/kit";
import { f as jiraGetTasks, b as buildJiraErrorMessage } from "../../../../../chunks/jira.js";
import { g as getUserAccess, b as buildTasksJqlForUser } from "../../../../../chunks/auth.js";
const GET = async ({ locals, url }) => {
  if (!locals.user) {
    return json({ ok: false, message: "no autenticado" }, { status: 401 });
  }
  try {
    const user_access = getUserAccess(locals.user);
    if (!user_access) {
      return json({ ok: false, message: "usuario no autorizado" }, { status: 401 });
    }
    const base_jql = buildTasksJqlForUser(user_access);
    const extra_jql = (url.searchParams.get("jql") || "").trim();
    const jql = extra_jql ? `${base_jql} AND (${extra_jql})` : base_jql;
    const data = await jiraGetTasks({
      jql,
      start_at: url.searchParams.get("start_at"),
      max_results: url.searchParams.get("max_results"),
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
