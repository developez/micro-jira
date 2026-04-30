import { fail, redirect } from "@sveltejs/kit";
import { r as resolveCanonicalUsername, c as createSessionCookie } from "../../../chunks/auth.js";
const load = async ({ locals }) => {
  if (locals.user) redirect(303, "/");
  return {};
};
const actions = {
  default: async ({ request, cookies }) => {
    const form_data = await request.formData();
    const username = String(form_data.get("username") || "").trim();
    const password = String(form_data.get("password") || "");
    if (!username || !password) {
      return fail(400, { message: "usuario y contraseña son obligatorios" });
    }
    const canonical_username = resolveCanonicalUsername(username, password);
    if (!canonical_username) {
      return fail(401, { message: "credenciales incorrectas" });
    }
    const session_value = createSessionCookie(canonical_username);
    cookies.set("session", session_value, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 8
    });
    redirect(303, "/");
  }
};
export {
  actions,
  load
};
