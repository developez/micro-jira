import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

const root_dir = process.cwd();
const env_path = resolve(root_dir, '.env');

function fail(messages) {
    console.error('\n[config] Error de configuracion:');
    for (const message of messages) {
        console.error(`- ${message}`);
    }
    console.error('\n[config] No existe o tiene algún problema: .env/users.credentials y vuelve a iniciar la aplicacion.\n');
    process.exit(1);
}

function parseEnvFile(path) {
    const values = {};
    const lines = readFileSync(path, 'utf-8').split(/\r?\n/);

    for (const raw_line of lines) {
        const line = raw_line.trim();
        if (!line || line.startsWith('#')) continue;

        const equals_idx = line.indexOf('=');
        if (equals_idx === -1) continue;

        const key = line.slice(0, equals_idx).trim();
        let value = line.slice(equals_idx + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        values[key] = value;
    }

    return values;
}

function resolveCredentialsPath(credentials_file) {
    const normalized = credentials_file.trim();
    if (isAbsolute(normalized) || /^[A-Za-z]:[/\\]/.test(normalized)) {
        return normalized;
    }
    return resolve(root_dir, normalized);
}

function validateCredentialsFile(credentials_path) {
    const errors = [];
    const content = readFileSync(credentials_path, 'utf-8');
    const lines = content.split(/\r?\n/);
    let valid_rows = 0;

    lines.forEach((raw_line, index) => {
        const line_number = index + 1;
        const line = raw_line.trim();
        if (!line || line.startsWith('#')) return;

        const parts = line.split(';').map((part) => part.trim());
        if (parts.length < 4 || parts.length > 5) {
            errors.push(`users.credentials linea ${line_number}: formato invalido, esperado usuario;password;jira_user_id;estados;alias_opcional`);
            return;
        }

        const [username, password, jira_user_id, raw_status_ids] = parts;
        const status_ids = raw_status_ids
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

        if (!username) errors.push(`users.credentials linea ${line_number}: usuario vacio`);
        if (!password) errors.push(`users.credentials linea ${line_number}: password vacia`);
        if (!jira_user_id) errors.push(`users.credentials linea ${line_number}: jira_user_id vacio`);
        if (status_ids.length === 0) {
            errors.push(`users.credentials linea ${line_number}: debe indicar al menos un estado permitido`);
        }
        if (status_ids.some((value) => !/^\d+$/.test(value))) {
            errors.push(`users.credentials linea ${line_number}: los estados permitidos deben ser IDs numericos separados por coma`);
        }

        if (username && password && jira_user_id && status_ids.length > 0 && status_ids.every((value) => /^\d+$/.test(value))) {
            valid_rows += 1;
        }
    });

    if (valid_rows === 0) {
        errors.push('users.credentials no contiene ninguna fila valida');
    }

    return errors;
}

const errors = [];

if (!existsSync(env_path)) {
    fail(['no existe el archivo .env en la raiz del proyecto']);
}

const env_values = parseEnvFile(env_path);
const required_env_keys = [
    'JIRA_NAME',
    'JIRA_BASE_URL',
    'JIRA_EMAIL_TOKEN',
    'JIRA_TOKEN',
    'JIRA_PROJECT_KEY',
    'SESSION_SECRET',
    'CREDENTIALS_FILE'
];

for (const key of required_env_keys) {
    if (!env_values[key] || !env_values[key].trim()) {
        errors.push(`falta ${key} en .env`);
    }
}

if (env_values.JIRA_BASE_URL) {
    try {
        const jira_url = new URL(env_values.JIRA_BASE_URL);
        if (!['http:', 'https:'].includes(jira_url.protocol)) {
            errors.push('JIRA_BASE_URL debe empezar por http:// o https://');
        }
    } catch {
        errors.push('JIRA_BASE_URL no es una URL valida');
    }
}

if (env_values.SESSION_SECRET && env_values.SESSION_SECRET.length < 16) {
    errors.push('SESSION_SECRET debe tener al menos 16 caracteres');
}

if (env_values.CREDENTIALS_FILE) {
    const credentials_path = resolveCredentialsPath(env_values.CREDENTIALS_FILE);
    if (!existsSync(credentials_path)) {
        errors.push(`no existe CREDENTIALS_FILE: ${env_values.CREDENTIALS_FILE}`);
    } else {
        errors.push(...validateCredentialsFile(credentials_path));
    }
}

if (errors.length > 0) {
    fail(errors);
}

console.log('[config] .env y users.credentials validados correctamente.');
