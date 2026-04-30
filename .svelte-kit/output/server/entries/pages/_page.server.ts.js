import { redirect } from "@sveltejs/kit";
import { g as getSiteName } from "../../chunks/site.js";
const load = async ({ locals }) => {
  if (!locals.user) redirect(303, "/login");
  return { user: locals.user, site_name: getSiteName() };
};
export {
  load
};
