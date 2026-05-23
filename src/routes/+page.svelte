<script lang="ts">
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import type { PageData } from './$types';
    import { adfToHtml, escapeHtml } from '$lib/adf';
    import {
        normalizeIssue,
        rebuildHierarchy,
        getStatusClass,
        getPriorityClass,
        formatDateText,
        extractAttachmentItems,
        extractCommentItems,
        findDoneTransition,
        getDefaultDetailState
    } from '$lib/normalize';
    import type { NormalizedIssue, DetailState } from '$lib/normalize';

    let { data }: { data: PageData } = $props();

    // --- Estado ---
    let status_text = $state('Cargando tickets...');
    let issue_by_key = $state<Record<string, NormalizedIssue>>({});
    let children_by_parent_key = $state<Record<string, string[]>>({});
    let root_issue_keys = $state<string[]>([]);
    let expanded_keys = $state<string[]>([]);
    let selected_key = $state('');
    let detail_by_key = $state<Record<string, DetailState>>({});
    let detail_layout = $state<'side' | 'below'>('side');
    let preview_image_src = $state('');
    let preview_image_alt = $state('');

    // --- Derivados ---
    type FlatRow = { issue: NormalizedIssue; level: number; has_children: boolean; is_expanded: boolean };

    let visible_rows = $derived.by<FlatRow[]>(() => {
        function flatten(keys: string[], level: number): FlatRow[] {
            const rows: FlatRow[] = [];
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

    let current_detail = $derived(selected_key ? (detail_by_key[selected_key] ?? null) : null);
    let done_transition = $derived(current_detail ? findDoneTransition(current_detail.transitions) : null);

    // --- Helpers ---
    function ensureDetail(key: string): DetailState {
        if (!detail_by_key[key]) {
            detail_by_key[key] = getDefaultDetailState();
        }
        return detail_by_key[key];
    }

    async function callApi(
        path: string,
        options: { method?: string; query?: Record<string, string>; body?: unknown } = {}
    ): Promise<any> {
        const method = options.method || 'GET';
        let url = path;
        if (options.query) {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(options.query)) {
                if (v != null) params.set(k, v);
            }
            url += '?' + params.toString();
        }
        const fetch_opts: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (options.body && method !== 'GET') {
            fetch_opts.body = JSON.stringify(options.body);
        }
        const response = await fetch(url, fetch_opts);
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(json.message || `HTTP ${response.status}`);
        }
        return json;
    }

    // --- Acciones ---
    async function loadTickets() {
        status_text = 'Cargando tickets...';
        const json = await callApi(`${base}/api/jira/tasks`, {
            query: { start_at: '0', max_results: '100', include_description: 'false' }
        });
        const payload = json.data || {};
        const raw_issues = Array.isArray(payload.issues) ? payload.issues : [];
        const normalized = raw_issues.map(normalizeIssue);
        const result = rebuildHierarchy(normalized);
        issue_by_key = result.issue_by_key;
        children_by_parent_key = result.children_by_parent_key;
        root_issue_keys = result.root_issue_keys;
        expanded_keys = [];
        detail_by_key = {};

        if (!selected_key || !issue_by_key[selected_key]) {
            selected_key = result.root_issue_keys[0] || '';
        }

        const total = normalized.length;
        const level1 = result.root_issue_keys.length;
        status_text = `Mostrando ${total} items. Nivel 1: ${level1}.`;

        if (selected_key) {
            await loadIssueDetail(selected_key);
        }
    }

    async function loadIssueDetail(key: string) {
        const detail = ensureDetail(key);
        detail.is_loading = true;
        detail.is_loaded = false;
        detail.error_text = '';

        try {
            const [detail_resp, transitions_resp] = await Promise.all([
                callApi(`${base}/api/jira/task-detail`, {
                    query: { issue_key: key, include_description: 'true' }
                }),
                callApi(`${base}/api/jira/tasks-transitions`, {
                    query: { issue_key: key }
                })
            ]);

            const detail_payload = detail_resp.data || {};
            const transitions_payload = transitions_resp.data || {};
            const attachment_items = extractAttachmentItems(detail_payload, base);
            const description_adf = detail_payload?.fields?.description ?? null;

            detail.attachment_items = attachment_items;
            detail.description_html = adfToHtml(description_adf, { attachment_items });
            detail.comment_items = extractCommentItems(detail_payload);
            detail.transitions = Array.isArray(transitions_payload.transitions)
                ? transitions_payload.transitions
                : [];
            detail.is_loaded = true;

            if (!detail.selected_transition_id) {
                const done = findDoneTransition(detail.transitions);
                if (done) detail.selected_transition_id = String(done.id || '');
                else if (detail.transitions.length > 0)
                    detail.selected_transition_id = String(detail.transitions[0].id || '');
            }
        } catch (error: any) {
            detail.error_text = error?.message || String(error);
        } finally {
            detail.is_loading = false;
        }
    }

    async function selectIssue(key: string) {
        if (!key) return;
        selected_key = key;
        const detail = ensureDetail(key);
        if (!detail.is_loaded && !detail.is_loading) {
            await loadIssueDetail(key);
        }
    }

    function toggleExpand(key: string) {
        const child_keys = children_by_parent_key[key] || [];
        if (child_keys.length === 0) return;
        if (expanded_keys.includes(key)) {
            expanded_keys = expanded_keys.filter((k) => k !== key);
        } else {
            expanded_keys = [...expanded_keys, key];
        }
    }

    async function submitComment(key: string) {
        const detail = detail_by_key[key];
        const comment = (detail?.comment_text || '').trim();
        if (!comment) throw new Error('Escribe un comentario');
        await callApi(`${base}/api/jira/tasks-comment`, {
            method: 'POST',
            body: { issue_key: key, comment }
        });
        detail.comment_text = '';
        await loadIssueDetail(key);
        status_text = 'Comentario agregado en ' + key;
    }

    async function submitStatusChange(key: string) {
        const detail = detail_by_key[key];
        const done = findDoneTransition(detail?.transitions || []);
        const transition_id = String(done?.id || detail?.selected_transition_id || '').trim();
        if (!transition_id) throw new Error('No hay transición a HECHO/Done');
        await callApi(`${base}/api/jira/tasks-change-status`, {
            method: 'POST',
            body: { issue_key: key, transition_id }
        });
        const sel_transition = detail?.transitions.find(
            (t: any) => String(t.id || '') === transition_id
        );
        if (issue_by_key[key] && sel_transition?.to?.name) {
            issue_by_key[key].status_name = sel_transition.to.name;
            issue_by_key[key].status_id = String(sel_transition.to.id || '');
        }
        await loadIssueDetail(key);
        status_text = 'Estado HECHO aplicado en ' + key;
    }

    async function runAction(action_fn: () => Promise<void>) {
        try {
            status_text = 'Procesando...';
            await action_fn();
        } catch (error: any) {
            status_text = 'Error: ' + (error?.message || String(error));
        }
    }

    async function logout() {
        await fetch(`${base}/api/logout`, { method: 'POST' });
        window.location.href = `${base}/login`;
    }

    function openImagePreview(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        const image = target?.closest('img.adf_image') as HTMLImageElement | null;
        if (!image) return;

        preview_image_src = image.currentSrc || image.src;
        preview_image_alt = image.alt || 'Imagen Jira';
    }

    function imagePreviewAction(node: HTMLElement) {
        node.addEventListener('click', openImagePreview);
        return {
            destroy() {
                node.removeEventListener('click', openImagePreview);
            }
        };
    }

    function closeImagePreview() {
        preview_image_src = '';
        preview_image_alt = '';
    }

    function closeImagePreviewFromOverlay(event: MouseEvent) {
        if (event.target === event.currentTarget) closeImagePreview();
    }

    function handlePreviewKeydown(event: KeyboardEvent) {
        if (!preview_image_src) return;
        if (event.key === 'Escape') closeImagePreview();
    }

    onMount(() => {
        void runAction(loadTickets);
    });
</script>

<div class="app">
    <section class="top_bar">
        <div class="form_row">
            <div class="top_right_info">
                <div class="jira_brand">
                    <span class="jira_brand_icon_wrap">
                        <svg class="jira_brand_icon" viewBox="0 0 24 24">
                            <path fill="var(--tile-color,#1868db)" d="M0 6a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z"></path>
                            <path fill="var(--icon-color, white)" d="M9.051 15.434H7.734c-1.988 0-3.413-1.218-3.413-3h7.085c.367 0 .605.26.605.63v7.13c-1.772 0-2.96-1.435-2.96-3.434zm3.5-3.543h-1.318c-1.987 0-3.413-1.196-3.413-2.978h7.085c.367 0 .627.239.627.608v7.13c-1.772 0-2.981-1.435-2.981-3.434zm3.52-3.522h-1.317c-1.987 0-3.413-1.217-3.413-3h7.085c.367 0 .605.262.605.61v7.129c-1.771 0-2.96-1.435-2.96-3.434z"></path>
                        </svg>
                    </span>
                    <span class="jira_brand_text">micro-Jira</span>
                    <span class="jira_brand_env"><strong>- {data.site_name} -</strong></span>
                    <span class="jira_brand_user">Usuario:&nbsp;&nbsp;<strong>{data.user}</strong></span>
                </div>
            </div>
            <div class="top_actions">
                <button
                    onclick={() => runAction(loadTickets)}
                    class="icon_btn"
                    type="button"
                    title="Refrescar tabla"
                    aria-label="Refrescar tabla"
                >
                    <svg class="action_icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            d="M17.65 6.35A7.95 7.95 0 0012 4a8 8 0 100 16 8 8 0 007.75-6h-2.1A6 6 0 1112 6c1.3 0 2.5.42 3.45 1.12L13 10h7V3l-2.35 3.35z"
                        />
                    </svg>
                </button>
                <button
                    onclick={logout}
                    class="icon_btn"
                    type="button"
                    title="Salir"
                    aria-label="Salir"
                >
                    <svg class="action_icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            d="M10 4h8a2 2 0 012 2v12a2 2 0 01-2 2h-8v-2h8V6h-8V4zm1.7 12.3l1.4-1.4-2.6-2.6H16v-2h-5.5l2.6-2.6-1.4-1.4L6.7 11l5 5.3z"
                        />
                    </svg>
                </button>
            </div>
        </div>
        <!--<div class="status_line">{status_text}</div>-->
    </section>

    <section class="content_layout {detail_layout === 'below' ? 'detail_below' : ''}">
        <div class="table_wrap">
            <table>
                <thead>
                    <tr>
                        <th class="col_activity">Actividad</th>
                        <th class="col_type">Tipo</th>
                        <th class="col_assignee">Área</th>
                        <th class="col_priority">Prioridad</th>
                        <th class="col_status">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {#each visible_rows as row (row.issue.issue_key)}
                        <tr
                            class={row.issue.issue_key === selected_key ? 'row_selected' : ''}
                            onclick={() => runAction(() => selectIssue(row.issue.issue_key))}
                        >
                            <td>
                                <div
                                    class="activity_cell"
                                    style="padding-left: {row.level * 18}px"
                                >
                                    <button
                                        class="expander{row.has_children ? '' : ' empty'}"
                                        type="button"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(row.issue.issue_key);
                                        }}
                                    >
                                        {row.is_expanded ? '|' : '>'}
                                    </button>
                                    {#if row.issue.issue_type_icon_url}
                                        <img
                                            class="issue_type_icon"
                                            src={row.issue.issue_type_icon_url}
                                            alt={row.issue.issue_type_name}
                                        />
                                    {/if}
                                    <span class="issue_key">{row.issue.issue_key}</span>
                                    <span class="summary_text">{row.issue.summary}</span>
                                </div>
                            </td>
                            <td>{row.issue.issue_type_name}</td>
                            <td>{row.issue.assignee_name}</td>
                            <td>
                                <span class="priority_badge {getPriorityClass(row.issue.priority_name)}">
                                    {row.issue.priority_name}
                                </span>
                            </td>
                            <td>
                                <span class="status_badge {getStatusClass(row.issue.status_name, row.issue.status_id)}">
                                    {row.issue.status_name}
                                </span>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <aside class="detail_sidebar">
            <div class="detail_layout_bar">
                <button
                    class="icon_btn"
                    type="button"
                    title={detail_layout === 'side' ? 'Ver detalle debajo' : 'Ver detalle a la derecha'}
                    aria-label={detail_layout === 'side' ? 'Ver detalle debajo' : 'Ver detalle a la derecha'}
                    onclick={() => (detail_layout = detail_layout === 'side' ? 'below' : 'side')}
                >
                    {#if detail_layout === 'side'}
                        <svg class="action_icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 4h16v6H4V4zm0 10h16v6H4v-6zm2-8v2h12V6H6zm0 10v2h12v-2H6z" />
                        </svg>
                    {:else}
                        <svg class="action_icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 4h7v16H4V4zm9 0h7v16h-7V4zM6 6v12h3V6H6zm9 0v12h3V6h-3z" />
                        </svg>
                    {/if}
                </button>
            </div>
            <div class="detail_sidebar_header">
                <div class="detail_sidebar_key">
                    {selected_key || 'Ningun item seleccionado'}
                </div>
                <div class="detail_sidebar_summary {selected_key ? '' : 'muted'}">
                    {selected_key && issue_by_key[selected_key]
                        ? issue_by_key[selected_key].summary
                        : 'Selecciona una fila para ver descripcion y comentarios.'}
                </div>
            </div>

            <div class="detail_pane">
                {#if !selected_key}
                    <div class="detail_block"><span class="muted">Panel vacio.</span></div>
                {:else if current_detail?.is_loading || (!current_detail?.is_loaded && !current_detail?.error_text)}
                    <div class="detail_block"><span class="muted">Cargando detalle...</span></div>
                {:else if current_detail?.error_text}
                    <div class="detail_block">
                        <span>Error: {current_detail.error_text}</span>
                    </div>
                {:else if current_detail?.is_loaded}
                    <div class="detail_block">
                        <div class="detail_title">Descripcion</div>
                        <div class="description_body" use:imagePreviewAction>
                            {#if current_detail.description_html}
                                {@html current_detail.description_html}
                            {:else}
                                <span class="muted">Sin descripcion</span>
                            {/if}
                        </div>
                    </div>

                    <div class="detail_block">
                        <div class="detail_title">Comentarios</div>
                        {#if current_detail.comment_items.length === 0}
                            <span class="muted">Sin comentarios</span>
                        {:else}
                            <ul class="comments_list">
                                {#each current_detail.comment_items as c}
                                    <li class="comment_item">
                                        <div class="comment_meta">
                                            {c.author_name} - {formatDateText(c.created_at)}
                                        </div>
                                        <div>
                                            {#each c.body_text.split('\n') as line, i}
                                                {#if i > 0}<br />{/if}{line}
                                            {/each}
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>

                    <div class="detail_block">
                        <div class="detail_title">Nuevo comentario</div>
                        <div class="detail_actions">
                            <textarea
                                placeholder="Escribe comentario..."
                                bind:value={detail_by_key[selected_key].comment_text}
                            ></textarea>
                            <div class="detail_actions_row">
                                <button
                                    class="btn_secondary"
                                    type="button"
                                    onclick={() => runAction(() => submitComment(selected_key))}
                                >
                                    Agregar comentario
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="detail_block">
                        <div class="detail_title">Estado</div>
                        <div class="detail_actions_row">
                            <button
                                class="primary"
                                type="button"
                                disabled={!done_transition}
                                title={done_transition
                                    ? 'Terminar -> ' + (done_transition?.to?.name || 'HECHO')
                                    : 'No hay transicion a HECHO disponible'}
                                onclick={() => runAction(() => submitStatusChange(selected_key))}
                            >
                                Pasar a HECHO
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </aside>
    </section>
</div>

<svelte:window onkeydown={handlePreviewKeydown} />

{#if preview_image_src}
    <div
        class="image_preview_overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Vista ampliada de imagen"
        tabindex="-1"
        onkeydown={handlePreviewKeydown}
        onclick={closeImagePreviewFromOverlay}
    >
        <div class="image_preview_shell">
            <div class="image_preview_bar">
                <span class="image_preview_title">{preview_image_alt}</span>
                <button
                    class="image_preview_close"
                    type="button"
                    title="Cerrar"
                    aria-label="Cerrar imagen"
                    onclick={closeImagePreview}
                >
                    x
                </button>
            </div>
            <img class="image_preview_img" src={preview_image_src} alt={preview_image_alt} />
        </div>
    </div>
{/if}

<style>
    :root {
        --jira_bg: #f7f8f9;
        --jira_surface: #ffffff;
        --jira_border: #d0d4dc;
        --jira_text: #172b4d;
        --jira_muted: #44546f;
        --jira_blue: #0052cc;
        --jira_blue_hover: #0c66e4;
        --jira_blue_soft: #deebff;
        --jira_blue_strong_soft: #b9d7ff;
        --jira_blue_strong_border: #4f84c4;
        --jira_green_soft: #dff2c1;
        --jira_green_border: #8db03f;
        --jira_orange_soft: #ffecb3;
        --jira_orange_border: #e2c15f;
        --jira_blue_border: #6e9ed6;
        --jira_red_soft: #ffd6d6;
        --jira_red_border: #d87373;
        --jira_gray_soft: #ebecf0;
        --jira_row_alt: #f4f5f7;
        --jira_row_hover: #ebecf0;
        --jira_row_selected: #dbe8ff;
    }

    * { box-sizing: border-box; }

    :global(body) {
        margin: 0;
        background: var(--jira_bg);
        color: var(--jira_text);
        font-size: 13px;
        line-height: 1.3;
    }

    .app {
        width: 100%;
        margin: 8px 0;
        padding: 0 8px;
    }

    .top_bar {
        background: var(--jira_surface);
        border: 1px solid var(--jira_border);
        border-radius: 6px;
        padding: 8px;
        display: grid;
        gap: 6px;
        margin-bottom: 8px;
    }

    .form_row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
    }

    .top_right_info {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        justify-content: flex-start;
    }

    .jira_brand {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--jira_text);
    }

    .jira_brand_icon_wrap {
        width: 20px;
        height: 20px;
        display: inline-flex;
    }

    .jira_brand_icon {
        width: 100%;
        height: 100%;
        display: block;
    }

    .jira_brand_text {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.2;
        display: inline-flex;
        align-items: center;
    }

    .jira_brand_env,
    .jira_brand_user {
        font-size: 12px;
        color: var(--jira_muted);
        white-space: nowrap;
        line-height: 1.2;
        display: inline-flex;
        align-items: center;
    }

    .top_actions {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .icon_btn {
        width: 30px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .action_icon {
        width: 16px;
        height: 16px;
        fill: currentColor;
        flex-shrink: 0;
    }

    .status_line {
        font-size: 12px;
        color: var(--jira_muted);
        min-height: 16px;
    }

    .content_layout {
        display: grid;
        grid-template-columns: minmax(0, 2.2fr) minmax(320px, 1fr);
        gap: 8px;
        align-items: start;
    }

    .content_layout.detail_below {
        grid-template-columns: 1fr;
    }

    .content_layout.detail_below .table_wrap {
        max-height: 45vh;
    }

    .content_layout.detail_below .detail_sidebar {
        min-height: 360px;
    }

    .content_layout.detail_below .detail_pane {
        max-height: none;
    }

    .table_wrap {
        background: var(--jira_surface);
        border: 1px solid var(--jira_border);
        border-radius: 6px;
        overflow: auto;
        max-height: calc(100vh - 120px);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        table-layout: fixed;
    }

    th, td {
        border-bottom: 1px solid var(--jira_border);
        padding: 6px 8px;
        text-align: left;
        white-space: nowrap;
        vertical-align: middle;
    }

    th {
        color: var(--jira_muted);
        font-size: 11px;
        font-weight: 600;
        position: sticky;
        top: 0;
        background: #f1f2f4;
        z-index: 2;
    }

    tbody tr { cursor: pointer; }
    tbody tr:nth-child(even) td { background: var(--jira_row_alt); }
    tbody tr:hover td { background: var(--jira_row_hover); }
    tbody tr.row_selected td { background: var(--jira_row_selected) !important; }

    .activity_cell {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .expander {
        width: 14px;
        height: 18px;
        border: none;
        background: transparent;
        font-size: 12px;
        line-height: 18px;
        color: var(--jira_muted);
        padding: 0;
        font-weight: 700;
        cursor: pointer;
        flex-shrink: 0;
    }

    .expander.empty { visibility: hidden; }

    .issue_key {
        color: var(--jira_blue);
        font-weight: 500;
        font-size: 12px;
        flex-shrink: 0;
    }

    .summary_text {
        color: var(--jira_text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
    }

    .issue_type_icon {
        width: 16px;
        height: 16px;
        object-fit: contain;
        flex-shrink: 0;
    }

    .status_badge, .priority_badge {
        display: inline-block;
        border-radius: 2px;
        padding: 1px 5px;
        font-size: 10px;
        font-weight: 600;
        color: #172b4d;
        border: 1px solid transparent;
        letter-spacing: 0.02em;
    }

    :global(.status_done)     { background: var(--jira_green_soft); border-color: var(--jira_green_border); }
    :global(.status_progress) { background: var(--jira_blue_soft);  border-color: #b3d4ff; }
    :global(.status_pending)  { background: var(--jira_gray_soft);  border-color: #dfe1e6; }
    :global(.status_10001)    { background: var(--jira_blue_soft); border-color: var(--jira_blue_border); }
    :global(.status_10002)    { background: var(--jira_blue_strong_soft); border-color: var(--jira_blue_strong_border); }
    :global(.status_10003)    { background: var(--jira_green_soft); border-color: var(--jira_green_border); }
    :global(.priority_low)    { background: var(--jira_blue_soft); border-color: var(--jira_blue_border); }
    :global(.priority_medium) { background: var(--jira_orange_soft); border-color: var(--jira_orange_border); }
    :global(.priority_high)   { background: var(--jira_red_soft); border-color: var(--jira_red_border); }

    .muted { color: var(--jira_muted); }

    .col_activity { width: 34%; }
    .col_type     { width: 8%; }
    .col_assignee { width: 14%; }
    .col_priority, .col_status { width: 7%; }

    .detail_sidebar {
        background: var(--jira_surface);
        border: 1px solid var(--jira_border);
        border-radius: 6px;
        min-height: calc(100vh - 120px);
        display: grid;
        grid-template-rows: auto auto 1fr;
        overflow: hidden;
    }

    .detail_layout_bar {
        border-bottom: 1px solid var(--jira_border);
        padding: 8px;
        display: flex;
        justify-content: flex-end;
        background: #fafbfc;
    }

    .detail_sidebar_header {
        border-bottom: 1px solid var(--jira_border);
        padding: 8px;
        display: grid;
        gap: 4px;
        background: #fafbfc;
    }

    .detail_sidebar_key {
        font-weight: 700;
        color: var(--jira_blue);
        font-size: 12px;
    }

    .detail_sidebar_summary {
        font-size: 12px;
        line-height: 1.4;
    }

    .detail_pane {
        margin: 8px;
        border: 1px solid var(--jira_border);
        border-radius: 4px;
        background: #fff;
        padding: 8px;
        display: grid;
        gap: 8px;
        align-content: start;
        max-height: calc(100vh - 180px);
        overflow: auto;
    }

    .detail_block {
        border: 1px solid var(--jira_border);
        border-radius: 4px;
        padding: 8px;
        background: #fff;
    }

    .detail_title {
        font-size: 11px;
        color: var(--jira_muted);
        font-weight: 700;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }

    .description_body {
        font-size: 12px;
        white-space: normal;
        line-height: 1.45;
    }

    :global(.description_body p)  { margin: 0 0 8px; }
    :global(.description_body ul, .description_body ol) { margin: 0 0 8px 18px; padding: 0; }
    :global(.description_body li) { margin-bottom: 4px; }
    :global(.description_body ul.adf_task_list) {
        list-style: none;
        margin: 0 0 8px 0;
        padding: 0;
    }
    :global(.description_body li.adf_task_item) {
        display: flex;
        align-items: flex-start;
        gap: 6px;
    }
    :global(.description_body .adf_task_state) {
        flex: 0 0 auto;
        color: var(--jira_muted);
        font-weight: 700;
    }
    :global(.description_body .adf_media_single) { margin: 8px 0; }
    :global(.description_body img.adf_image) {
        display: block;
        max-width: 100%;
        height: auto;
        border: 1px solid var(--jira_border);
        border-radius: 4px;
        cursor: zoom-in;
    }
    :global(.description_body img.adf_image:hover) {
        border-color: var(--jira_blue_hover);
    }
    :global(.description_body .adf_media_fallback) {
        font-size: 11px;
        color: var(--jira_muted);
        padding: 6px 8px;
        border: 1px dashed var(--jira_border);
        border-radius: 4px;
        background: #fafbfc;
    }

    .comments_list {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 4px;
        max-height: 260px;
        overflow: auto;
    }

    .comment_item { font-size: 12px; line-height: 1.35; white-space: normal; }

    .comment_meta {
        color: var(--jira_muted);
        font-size: 11px;
        margin-bottom: 2px;
    }

    .detail_actions { display: grid; gap: 8px; }

    .detail_actions_row {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }

    textarea {
        border: 1px solid var(--jira_border);
        border-radius: 3px;
        padding: 8px;
        font-size: 12px;
        color: var(--jira_text);
        background: #fff;
        font-family: inherit;
        line-height: 1.35;
        min-height: 72px;
        resize: vertical;
        width: 100%;
    }

    textarea:focus {
        outline: none;
        border-color: var(--jira_blue_hover);
        box-shadow: 0 0 0 1px var(--jira_blue_hover);
    }

    button {
        height: 30px;
        border: 1px solid var(--jira_border);
        border-radius: 3px;
        background: #fff;
        color: var(--jira_text);
        padding: 0 10px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
    }

    button:hover { background: #f7f8f9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    button.primary {
        background: var(--jira_blue);
        color: #fff;
        border-color: var(--jira_blue);
    }

    button.primary:hover { background: var(--jira_blue_hover); border-color: var(--jira_blue_hover); }

    .btn_secondary {
        background: #fff;
        color: var(--jira_blue);
        border-color: #b3d4ff;
    }

    .image_preview_overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(9, 30, 66, 0.72);
    }

    .image_preview_shell {
        width: min(1100px, 96vw);
        max-height: 92vh;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        background: var(--jira_surface);
        border: 1px solid var(--jira_border);
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 16px 40px rgba(9, 30, 66, 0.35);
    }

    .image_preview_bar {
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 8px 0 12px;
        border-bottom: 1px solid var(--jira_border);
        background: #fafbfc;
    }

    .image_preview_title {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 600;
        color: var(--jira_text);
    }

    .image_preview_close {
        width: 30px;
        padding: 0;
        flex: 0 0 auto;
    }

    .image_preview_img {
        display: block;
        max-width: 100%;
        max-height: calc(92vh - 40px);
        width: auto;
        height: auto;
        margin: auto;
        object-fit: contain;
        background: #fff;
    }

    @media (max-width: 1080px) {
        .content_layout { grid-template-columns: 1fr; }
        .detail_sidebar { min-height: 420px; }
        .detail_pane { max-height: none; }
    }
</style>
