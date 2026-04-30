import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.DlMwvmo8.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/DWnjytVo.js","_app/immutable/chunks/CxVGadtM.js","_app/immutable/chunks/C-j4wUyM.js","_app/immutable/chunks/Dy1HukI4.js"];
export const stylesheets = ["_app/immutable/assets/2.CLgnQf09.css"];
export const fonts = [];
