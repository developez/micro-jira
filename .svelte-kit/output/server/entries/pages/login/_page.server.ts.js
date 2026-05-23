import { fail, redirect } from "@sveltejs/kit";
import { b as base } from "../../../chunks/server.js";
import "../../../chunks/url.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import { r as resolveCanonicalUsername, c as createSessionCookie } from "../../../chunks/auth.js";
import { g as getSiteName } from "../../../chunks/site.js";
const load = async ({ locals }) => {
  if (locals.user) redirect(303, `${base}/`);
  return { site_name: getSiteName() };
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
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 8
    });
    redirect(303, `${base}/`);
  }
};
export {
  actions,
  load
};
