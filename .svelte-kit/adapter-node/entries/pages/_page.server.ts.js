import { redirect } from "@sveltejs/kit";
const load = async ({ locals }) => {
  if (!locals.user) redirect(303, "/login");
  return { user: locals.user };
};
export {
  load
};
