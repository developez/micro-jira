export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "micro-jira/_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.c0fIuZrE.js",app:"_app/immutable/entry/app.CxhBgF7Z.js",imports:["_app/immutable/entry/start.c0fIuZrE.js","_app/immutable/chunks/BfoKT9q6.js","_app/immutable/chunks/DUbjs2q9.js","_app/immutable/chunks/EPso8x0E.js","_app/immutable/chunks/DUTtLtOR.js","_app/immutable/entry/app.CxhBgF7Z.js","_app/immutable/chunks/EPso8x0E.js","_app/immutable/chunks/DUbjs2q9.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/D4gFjeHS.js","_app/immutable/chunks/Byu0-LwP.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/jira/attachment-content",
				pattern: /^\/api\/jira\/attachment-content\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/jira/attachment-content/_server.ts.js'))
			},
			{
				id: "/api/jira/task-detail",
				pattern: /^\/api\/jira\/task-detail\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/jira/task-detail/_server.ts.js'))
			},
			{
				id: "/api/jira/tasks-change-status",
				pattern: /^\/api\/jira\/tasks-change-status\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/jira/tasks-change-status/_server.ts.js'))
			},
			{
				id: "/api/jira/tasks-comment",
				pattern: /^\/api\/jira\/tasks-comment\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/jira/tasks-comment/_server.ts.js'))
			},
			{
				id: "/api/jira/tasks-transitions",
				pattern: /^\/api\/jira\/tasks-transitions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/jira/tasks-transitions/_server.ts.js'))
			},
			{
				id: "/api/jira/tasks",
				pattern: /^\/api\/jira\/tasks\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/jira/tasks/_server.ts.js'))
			},
			{
				id: "/api/logout",
				pattern: /^\/api\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/logout/_server.ts.js'))
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

export const prerendered = new Set([]);

export const base = "/micro-jira";