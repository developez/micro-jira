<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData } from './$types';
    import type { PageData } from './$types';

    let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="login_wrap">
    <div class="login_card">
        <div class="login_title">
            <span class="jira_brand_icon_wrap" aria-hidden="true">
                <svg class="jira_brand_icon" viewBox="0 0 24 24">
                    <path
                        fill="var(--tile-color,#1868db)"
                        d="M0 6a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z"
                    ></path>
                    <path
                        fill="var(--icon-color, white)"
                        d="M9.051 15.434H7.734c-1.988 0-3.413-1.218-3.413-3h7.085c.367 0 .605.26.605.63v7.13c-1.772 0-2.96-1.435-2.96-3.434zm3.5-3.543h-1.318c-1.987 0-3.413-1.196-3.413-2.978h7.085c.367 0 .627.239.627.608v7.13c-1.772 0-2.981-1.435-2.981-3.434zm3.52-3.522h-1.317c-1.987 0-3.413-1.217-3.413-3h7.085c.367 0 .605.262.605.61v7.129c-1.771 0-2.96-1.435-2.96-3.434z"
                    ></path>
                </svg>
            </span>
            <span>micro-Jira</span>
        </div>
        <div class="login_env"><strong>{data.site_name}</strong></div>
        <form method="POST" use:enhance>
            <div class="field">
                <label for="username">usuario</label>
                <input id="username" name="username" type="text" autocomplete="username" />
            </div>
            <div class="field">
                <label for="password">contraseña</label>
                <input id="password" name="password" type="password" autocomplete="current-password" />
            </div>
            {#if form?.message}
                <div class="error_msg">{form.message}</div>
            {/if}
            <button type="submit" class="primary">Entrar</button>
        </form>
    </div>
</div>

<style>
    :root {
        --jira_bg: #f7f8f9;
        --jira_surface: #ffffff;
        --jira_border: #d0d4dc;
        --jira_text: #172b4d;
        --jira_muted: #44546f;
        --jira_blue: #0052cc;
        --jira_blue_hover: #0c66e4;
    }

    * { box-sizing: border-box; }

    :global(body) {
        margin: 0;
        background: var(--jira_bg);
        color: var(--jira_text);
        font-size: 13px;
    }

    .login_wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
    }

    .login_card {
        background: var(--jira_surface);
        border: 1px solid var(--jira_border);
        border-radius: 6px;
        padding: 32px;
        width: 320px;
        display: grid;
        gap: 16px;
    }

    .login_title {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-size: 22px;
        font-weight: 700;
        color: var(--jira_blue);
        text-align: center;
    }

    .jira_brand_icon_wrap {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 28px;
    }

    .jira_brand_icon {
        width: 100%;
        height: 100%;
        display: block;
    }

    .login_env {
        text-align: center;
        color: var(--jira_text);
        font-size: 12px;
        letter-spacing: 0.3px;
        margin-top: -6px;
    }

    form {
        display: grid;
        gap: 12px;
    }

    .field {
        display: grid;
        gap: 4px;
    }

    .field label {
        font-size: 11px;
        color: var(--jira_muted);
        font-weight: 500;
    }

    input {
        height: 34px;
        border: 1px solid var(--jira_border);
        border-radius: 3px;
        padding: 0 10px;
        font-size: 13px;
        color: var(--jira_text);
        background: #fff;
        width: 100%;
    }

    input:focus {
        outline: none;
        border-color: var(--jira_blue_hover);
        box-shadow: 0 0 0 1px var(--jira_blue_hover);
    }

    button.primary {
        height: 34px;
        background: var(--jira_blue);
        color: #fff;
        border: none;
        border-radius: 3px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
    }

    button.primary:hover {
        background: var(--jira_blue_hover);
    }

    .error_msg {
        font-size: 12px;
        color: #c00;
        padding: 6px 8px;
        background: #fff0f0;
        border: 1px solid #fcc;
        border-radius: 3px;
    }
</style>
