import { e as escape_html, a as ensure_array_like, b as attr_class, c as clsx, d as attr_style, f as stringify, h as attr, i as derived } from "../../chunks/root.js";
import "../../chunks/url.js";
import "@sveltejs/kit/internal/server";
function getStatusClass(status_name, status_id = "") {
  const sid = String(status_id || "").trim();
  if (sid === "10001") return "status_10001";
  if (sid === "10002") return "status_10002";
  if (sid === "10003") return "status_10003";
  const s = String(status_name || "").toLowerCase();
  if (s.includes("done") || s.includes("hecho") || s.includes("cerr")) return "status_done";
  if (s.includes("progress") || s.includes("proceso") || s.includes("curso")) return "status_progress";
  return "status_pending";
}
function getPriorityClass(priority_name) {
  const p = String(priority_name || "").trim().toLowerCase();
  if (p === "highest" || p === "high") return "priority_high";
  if (p === "medium") return "priority_medium";
  if (p === "lowest" || p === "low") return "priority_low";
  return "priority_medium";
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let issue_by_key = {};
    let children_by_parent_key = {};
    let root_issue_keys = [];
    let expanded_keys = [];
    let selected_key = "";
    let visible_rows = derived(() => {
      function flatten(keys, level) {
        const rows = [];
        for (const key of keys) {
          const issue = issue_by_key[key];
          if (!issue) continue;
          const child_keys = children_by_parent_key[key] || [];
          const has_children = child_keys.length > 0;
          const is_expanded = expanded_keys.includes(key);
          rows.push({ issue, level, has_children, is_expanded });
          if (has_children && is_expanded) {
            rows.push(...flatten(child_keys, level + 1));
          }
        }
        return rows;
      }
      return flatten(root_issue_keys, 0);
    });
    $$renderer2.push(`<div class="app svelte-1uha8ag"><section class="top_bar svelte-1uha8ag"><div class="form_row svelte-1uha8ag"><div class="top_right_info svelte-1uha8ag"><div class="jira_brand svelte-1uha8ag"><span class="jira_brand_icon_wrap svelte-1uha8ag"><svg class="jira_brand_icon svelte-1uha8ag" viewBox="0 0 24 24"><path fill="var(--tile-color,#1868db)" d="M0 6a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z" class="svelte-1uha8ag"></path><path fill="var(--icon-color, white)" d="M9.051 15.434H7.734c-1.988 0-3.413-1.218-3.413-3h7.085c.367 0 .605.26.605.63v7.13c-1.772 0-2.96-1.435-2.96-3.434zm3.5-3.543h-1.318c-1.987 0-3.413-1.196-3.413-2.978h7.085c.367 0 .627.239.627.608v7.13c-1.772 0-2.981-1.435-2.981-3.434zm3.52-3.522h-1.317c-1.987 0-3.413-1.217-3.413-3h7.085c.367 0 .605.262.605.61v7.129c-1.771 0-2.96-1.435-2.96-3.434z" class="svelte-1uha8ag"></path></svg></span> <span class="jira_brand_text svelte-1uha8ag">micro-Jira</span> <span class="jira_brand_env svelte-1uha8ag"><strong class="svelte-1uha8ag">- ${escape_html(data.site_name)} -</strong></span> <span class="jira_brand_user svelte-1uha8ag">Usuario:  <strong class="svelte-1uha8ag">${escape_html(data.user)}</strong></span></div></div> <div class="top_actions svelte-1uha8ag"><button class="icon_btn svelte-1uha8ag" type="button" title="Refrescar tabla" aria-label="Refrescar tabla"><svg class="action_icon svelte-1uha8ag" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A7.95 7.95 0 0012 4a8 8 0 100 16 8 8 0 007.75-6h-2.1A6 6 0 1112 6c1.3 0 2.5.42 3.45 1.12L13 10h7V3l-2.35 3.35z" class="svelte-1uha8ag"></path></svg></button> <button class="icon_btn svelte-1uha8ag" type="button" title="Salir" aria-label="Salir"><svg class="action_icon svelte-1uha8ag" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4h8a2 2 0 012 2v12a2 2 0 01-2 2h-8v-2h8V6h-8V4zm1.7 12.3l1.4-1.4-2.6-2.6H16v-2h-5.5l2.6-2.6-1.4-1.4L6.7 11l5 5.3z" class="svelte-1uha8ag"></path></svg></button></div></div></section> <section class="content_layout svelte-1uha8ag"><div class="table_wrap svelte-1uha8ag"><table class="svelte-1uha8ag"><thead class="svelte-1uha8ag"><tr class="svelte-1uha8ag"><th class="col_activity svelte-1uha8ag">Actividad</th><th class="col_type svelte-1uha8ag">Tipo</th><th class="col_assignee svelte-1uha8ag">Persona asignada</th><th class="col_priority svelte-1uha8ag">Prioridad</th><th class="col_status svelte-1uha8ag">Estado</th></tr></thead><tbody class="svelte-1uha8ag"><!--[-->`);
    const each_array = ensure_array_like(visible_rows());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let row = each_array[$$index];
      $$renderer2.push(`<tr${attr_class(clsx(row.issue.issue_key === selected_key ? "row_selected" : ""), "svelte-1uha8ag")}><td class="svelte-1uha8ag"><div class="activity_cell svelte-1uha8ag"${attr_style(`padding-left: ${stringify(row.level * 18)}px`)}><button${attr_class(`expander${stringify(row.has_children ? "" : " empty")}`, "svelte-1uha8ag")} type="button">${escape_html(row.is_expanded ? "|" : ">")}</button> `);
      if (row.issue.issue_type_icon_url) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<img class="issue_type_icon svelte-1uha8ag"${attr("src", row.issue.issue_type_icon_url)}${attr("alt", row.issue.issue_type_name)}/>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <span class="issue_key svelte-1uha8ag">${escape_html(row.issue.issue_key)}</span> <span class="summary_text svelte-1uha8ag">${escape_html(row.issue.summary)}</span></div></td><td class="svelte-1uha8ag">${escape_html(row.issue.issue_type_name)}</td><td class="svelte-1uha8ag">${escape_html(row.issue.assignee_name)}</td><td class="svelte-1uha8ag"><span${attr_class(`priority_badge ${stringify(getPriorityClass(row.issue.priority_name))}`, "svelte-1uha8ag")}>${escape_html(row.issue.priority_name)}</span></td><td class="svelte-1uha8ag"><span${attr_class(`status_badge ${stringify(getStatusClass(row.issue.status_name, row.issue.status_id))}`, "svelte-1uha8ag")}>${escape_html(row.issue.status_name)}</span></td></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div> <aside class="detail_sidebar svelte-1uha8ag"><div class="detail_sidebar_header svelte-1uha8ag"><div class="detail_sidebar_key svelte-1uha8ag">${escape_html("Ningun item seleccionado")}</div> <div${attr_class(`detail_sidebar_summary ${stringify("muted")}`, "svelte-1uha8ag")}>${escape_html("Selecciona una fila para ver descripcion y comentarios.")}</div></div> <div class="detail_pane svelte-1uha8ag">`);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="detail_block svelte-1uha8ag"><span class="muted svelte-1uha8ag">Panel vacio.</span></div>`);
    }
    $$renderer2.push(`<!--]--></div></aside></section></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
