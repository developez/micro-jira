# micro-Jira

**micro-Jira** es una interfaz web ligera para consultar y operar tickets de Jira desde una UI minima.

Permite **listar tareas**, ver **detalle**, revisar **comentarios**, consultar **transiciones**, añadir comentarios y actualizar estado de tickets.

## Stack

- **SvelteKit**
- **TypeScript**
- **Vite**
- **Axios**
- **Adapter Node** para despliegue

## Configuracion

Crea tu archivo `.env` a partir de `.env.sample`:

```env
JIRA_NAME=REAL JIRA NAME
JIRA_BASE_URL=https://real.atlassian.net
JIRA_EMAIL_TOKEN=real@domain.com
JIRA_TOKEN=XXXX
JIRA_PROJECT_KEY=AAA
SESSION_SECRET=mysecretkey
CREDENTIALS_FILE=users.credentials
```

Crea tambien `users.credentials` a partir de `users.credentials.sample`:

```txt
#Format: [jira_user_login];[micro_jira_pass];[jira_user_id];[states_per_coma],[login_name]
user@domain.com;mypass1234;789025:cee4335-99bc-19f6-8e97-49f488f12345;10001,10002,10003;user
```

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Para ejecutar el build Node:

```bash
npm run start
```

## Estructura principal

- `src/routes/+page.svelte`: pantalla principal de tickets.
- `src/routes/login/+page.svelte`: pantalla de login.
- `src/lib/server/jira.ts`: cliente y operaciones Jira.
- `src/lib/server/auth.ts`: validacion de credenciales y sesion.
- `src/routes/api/jira/*`: endpoints server-side para Jira.

## Seguridad

No subas archivos con secretos reales:

- `.env`
- `users.credentials`
- tokens de Jira
- secretos de sesion

Usa siempre los archivos `.sample` como plantilla publica.
