import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.DWhaaO2Z.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/DUbjs2q9.js","_app/immutable/chunks/EPso8x0E.js","_app/immutable/chunks/D4gFjeHS.js","_app/immutable/chunks/Byu0-LwP.js","_app/immutable/chunks/DsZz9Nx_.js","_app/immutable/chunks/DUTtLtOR.js"];
export const stylesheets = ["_app/immutable/assets/2.DntKZvnO.css"];
export const fonts = [];
