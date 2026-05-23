

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BG7bcxmx.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/EPso8x0E.js","_app/immutable/chunks/Byu0-LwP.js"];
export const stylesheets = ["_app/immutable/assets/0.Cn1abX9y.css"];
export const fonts = [];
