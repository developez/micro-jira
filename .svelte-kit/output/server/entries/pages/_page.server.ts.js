import { redirect } from "@sveltejs/kit";
import { b as base } from "../../chunks/server.js";
import "../../chunks/url.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import { g as getSiteName } from "../../chunks/site.js";
const load = async ({ locals }) => {
  if (!locals.user) redirect(303, `${base}/login`);
  return { user: locals.user, site_name: getSiteName() };
};
export {
  load
};
