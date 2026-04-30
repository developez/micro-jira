import { readFileSync } from 'fs';
import { createHmac } from 'crypto';
import { resolve } from 'path';
import { b as private_env } from './shared-server-DaWdgxVh.js';

function getCredentialsPath() {
  const cred_file = (private_env.CREDENTIALS_FILE || "users.credentials").trim();
  if (cred_file.startsWith("/") || /^[A-Za-z]:[/\\]/.test(cred_file)) {
    return cred_file;
  }
  return resolve(process.cwd(), cred_file);
}
function getSessionSecret() {
  return private_env.SESSION_SECRET || "dev_secret_change_in_production";
}
function parseStatusIds(raw_status_ids) {
  return raw_status_ids.split(",").map((value) => value.trim()).filter((value) => /^\d+$/.test(value));
}
function parseCredentialsLine(line) {
  const semicolon_parts = line.split(";").map((part) => part.trim());
  if (semicolon_parts.length >= 4) {
    const username2 = semicolon_parts[0];
    const password2 = semicolon_parts[1];
    const jira_user_id = semicolon_parts[2];
    const allowed_status_ids = parseStatusIds(semicolon_parts[3] || "");
    const alias = semicolon_parts[4] || "";
    if (!username2 || !password2 || !jira_user_id || allowed_status_ids.length === 0) {
      return null;
    }
    return { username: username2, password: password2, jira_user_id, allowed_status_ids, alias };
  }
  const colon_idx = line.indexOf(":");
  if (colon_idx === -1) return null;
  const username = line.slice(0, colon_idx).trim();
  const password = line.slice(colon_idx + 1).trim();
  if (!username || !password) return null;
  return { username, password, jira_user_id: username, allowed_status_ids: [], alias: "" };
}
function loadCredentialsRecords() {
  const records = [];
  try {
    const content = readFileSync(getCredentialsPath(), "utf-8");
    for (const raw_line of content.split("\n")) {
      const line = raw_line.trim();
      if (!line || line.startsWith("#")) continue;
      const record = parseCredentialsLine(line);
      if (record) records.push(record);
    }
  } catch {
  }
  return records;
}
function resolveCanonicalUsername(login_user, password) {
  const records = loadCredentialsRecords();
  const found = records.find((record) => {
    if (record.password !== password) return false;
    return record.username === login_user || !!record.alias && record.alias === login_user;
  });
  return found?.username || null;
}
function getUserAccess(username) {
  const records = loadCredentialsRecords();
  const found = records.find((record) => record.username === username);
  if (!found) return null;
  return {
    username: found.username,
    jira_user_id: found.jira_user_id,
    allowed_status_ids: found.allowed_status_ids
  };
}
function buildTasksJqlForUser(user_access) {
  if (user_access.allowed_status_ids.length === 0) {
    throw new Error("el usuario no tiene estados permitidos configurados");
  }
  const statuses = user_access.allowed_status_ids.join(",");
  if (user_access.jira_user_id.trim().toLowerCase() === "all") {
    return `status in (${statuses})`;
  }
  return `assignee = "${user_access.jira_user_id}" AND status in (${statuses})`;
}
function createSessionCookie(username) {
  const secret = getSessionSecret();
  const payload = Buffer.from(username).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}
function verifySessionCookie(cookie) {
  try {
    const dot_idx = cookie.lastIndexOf(".");
    if (dot_idx === -1) return null;
    const payload = cookie.slice(0, dot_idx);
    const sig = cookie.slice(dot_idx + 1);
    const secret = getSessionSecret();
    const expected_sig = createHmac("sha256", secret).update(payload).digest("hex");
    if (sig !== expected_sig) return null;
    return Buffer.from(payload, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}

export { buildTasksJqlForUser as b, createSessionCookie as c, getUserAccess as g, resolveCanonicalUsername as r, verifySessionCookie as v };
//# sourceMappingURL=auth-BaKqY0Pn.js.map
