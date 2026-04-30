import { c as escape_html } from './renderer-xtd2Wt_B.js';
import '@sveltejs/kit/internal';
import './root-DNngrR3l.js';
import '@sveltejs/kit/internal/server';
import './state.svelte-C3yIf5tx.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { form } = $$props;
    $$renderer2.push(`<div class="login_wrap svelte-1x05zx6"><div class="login_card svelte-1x05zx6"><div class="login_title svelte-1x05zx6"><span class="jira_brand_icon_wrap svelte-1x05zx6" aria-hidden="true"><svg class="jira_brand_icon svelte-1x05zx6" viewBox="0 0 24 24"><path fill="var(--tile-color,#1868db)" d="M0 6a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z" class="svelte-1x05zx6"></path><path fill="var(--icon-color, white)" d="M9.051 15.434H7.734c-1.988 0-3.413-1.218-3.413-3h7.085c.367 0 .605.26.605.63v7.13c-1.772 0-2.96-1.435-2.96-3.434zm3.5-3.543h-1.318c-1.987 0-3.413-1.196-3.413-2.978h7.085c.367 0 .627.239.627.608v7.13c-1.772 0-2.981-1.435-2.981-3.434zm3.52-3.522h-1.317c-1.987 0-3.413-1.217-3.413-3h7.085c.367 0 .605.262.605.61v7.129c-1.771 0-2.96-1.435-2.96-3.434z" class="svelte-1x05zx6"></path></svg></span> <span class="svelte-1x05zx6">micro-Jira</span></div> <div class="login_env svelte-1x05zx6"><strong class="svelte-1x05zx6">DEV-FLEETCENTINEL</strong></div> <form method="POST" class="svelte-1x05zx6"><div class="field svelte-1x05zx6"><label for="username" class="svelte-1x05zx6">usuario</label> <input id="username" name="username" type="text" autocomplete="username" class="svelte-1x05zx6"/></div> <div class="field svelte-1x05zx6"><label for="password" class="svelte-1x05zx6">contraseña</label> <input id="password" name="password" type="password" autocomplete="current-password" class="svelte-1x05zx6"/></div> `);
    if (form?.message) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="error_msg svelte-1x05zx6">${escape_html(form.message)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button type="submit" class="primary svelte-1x05zx6">Entrar</button></form></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DKBhlvPl.js.map
