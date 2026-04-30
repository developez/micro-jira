import { fail, redirect } from '@sveltejs/kit';
import { r as resolveCanonicalUsername, c as createSessionCookie } from './auth-BaKqY0Pn.js';
import 'fs';
import 'crypto';
import 'path';
import './shared-server-DaWdgxVh.js';

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

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 3;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DKBhlvPl.js')).default;
const server_id = "src/routes/login/+page.server.ts";
const imports = ["_app/immutable/nodes/3.CN1jm0wR.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/CxVGadtM.js","_app/immutable/chunks/DWnjytVo.js","_app/immutable/chunks/C-j4wUyM.js","_app/immutable/chunks/Dy1HukI4.js","_app/immutable/chunks/KuyuNg1V.js"];
const stylesheets = ["_app/immutable/assets/3.GRN-SsNT.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=3-Ds7EzHhp.js.map
