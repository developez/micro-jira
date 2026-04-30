import { n as noop } from './renderer-xtd2Wt_B.js';
import './root-DNngrR3l.js';
import '@sveltejs/kit/internal/server';

const is_legacy = noop.toString().includes("$$") || /function \w+\(\) \{\}/.test(noop.toString());
const placeholder_url = "a:";
if (is_legacy) {
  ({
    url: new URL(placeholder_url)
  });
}
//# sourceMappingURL=state.svelte-C3yIf5tx.js.map
