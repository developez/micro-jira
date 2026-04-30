
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/jira" | "/api/jira/attachment-content" | "/api/jira/task-detail" | "/api/jira/tasks-change-status" | "/api/jira/tasks-comment" | "/api/jira/tasks-transitions" | "/api/jira/tasks" | "/api/logout" | "/login";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/api": Record<string, never>;
			"/api/jira": Record<string, never>;
			"/api/jira/attachment-content": Record<string, never>;
			"/api/jira/task-detail": Record<string, never>;
			"/api/jira/tasks-change-status": Record<string, never>;
			"/api/jira/tasks-comment": Record<string, never>;
			"/api/jira/tasks-transitions": Record<string, never>;
			"/api/jira/tasks": Record<string, never>;
			"/api/logout": Record<string, never>;
			"/login": Record<string, never>
		};
		Pathname(): "/" | "/api/jira/attachment-content" | "/api/jira/task-detail" | "/api/jira/tasks-change-status" | "/api/jira/tasks-comment" | "/api/jira/tasks-transitions" | "/api/jira/tasks" | "/api/logout" | "/login";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}