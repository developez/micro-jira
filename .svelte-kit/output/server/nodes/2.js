import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.DfrFLw03.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/BrlIH195.js","_app/immutable/chunks/DSR2JVe9.js","_app/immutable/chunks/BuMN7UR0.js","_app/immutable/chunks/DyPFks9Y.js","_app/immutable/chunks/B2-3e0B9.js"];
export const stylesheets = ["_app/immutable/assets/2.Ciam31Oc.css"];
export const fonts = [];
