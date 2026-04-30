import { redirect } from '@sveltejs/kit';

const load = async ({ locals }) => {
  if (!locals.user) redirect(303, "/login");
  return { user: locals.user };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 2;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-D5JqptxR.js')).default;
const server_id = "src/routes/+page.server.ts";
const imports = ["_app/immutable/nodes/2.Bwa7eKyM.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/DWnjytVo.js","_app/immutable/chunks/CxVGadtM.js","_app/immutable/chunks/C-j4wUyM.js","_app/immutable/chunks/Dy1HukI4.js"];
const stylesheets = ["_app/immutable/assets/2.CLgnQf09.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=2-BvJ9NxiN.js.map
