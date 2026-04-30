import axios from 'axios';
import { b as private_env } from './shared-server-DaWdgxVh.js';

function getJiraConfig() {
  const jira_base_url = (private_env.JIRA_BASE_URL || "https://fleetcentinel.atlassian.net").replace(/\/$/, "");
  const jira_email_token = private_env.JIRA_EMAIL_TOKEN || private_env.EMAIL_TOKEN || "";
  const jira_token = private_env.JIRA_TOKEN || "";
  const jira_project_key = private_env.JIRA_PROJECT_KEY || "KAN";
  return { jira_base_url, jira_email_token, jira_token, jira_project_key };
}
function createJiraClient(jira_config) {
  const auth_token = Buffer.from(`${jira_config.jira_email_token}:${jira_config.jira_token}`).toString("base64");
  return axios.create({
    baseURL: jira_config.jira_base_url,
    headers: {
      Authorization: `Basic ${auth_token}`,
      Accept: "application/json"
    }
  });
}
function parseIntParam(value, default_value, min_value, max_value) {
  const num_value = Number(value);
  if (!isFinite(num_value)) return default_value;
  const int_value = Math.floor(num_value);
  if (int_value < min_value) return min_value;
  if (int_value > max_value) return max_value;
  return int_value;
}
function parseBooleanParam(value, default_value) {
  if (value == null) return default_value;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") return true;
  if (normalized === "0" || normalized === "false" || normalized === "no") return false;
  return default_value;
}
function stripJqlOrderBy(jql) {
  return jql.replace(/\s+ORDER\s+BY\s+.+$/i, "").trim();
}
function buildRankedProjectJql(project_key, filter_jql) {
  const clean_filter_jql = stripJqlOrderBy(filter_jql);
  const project_jql = `project = ${project_key}`;
  const scoped_jql = clean_filter_jql ? `${project_jql} AND (${clean_filter_jql})` : project_jql;
  return `${scoped_jql} ORDER BY Rank ASC`;
}
function buildJiraErrorMessage(error) {
  const axios_error = error;
  const data = axios_error?.response?.data;
  if (data && Array.isArray(data.errorMessages) && data.errorMessages.length > 0) {
    return data.errorMessages.join(" | ");
  }
  if (data && data.errors && typeof data.errors === "object") {
    const errors_text = Object.keys(data.errors).map((key) => `${key}: ${data.errors[key]}`).join(" | ");
    if (errors_text) return errors_text;
  }
  if (data && typeof data === "string") return data;
  return error?.message || "Jira request error";
}
function buildAdfText(text) {
  return {
    type: "doc",
    version: 1,
    content: [{ type: "paragraph", content: [{ type: "text", text }] }]
  };
}
async function requestJira(client, config) {
  const response = await client.request(config);
  return response.data;
}
function resolveAttachmentUrl(attachment_id, variant) {
  const encoded_attachment_id = encodeURIComponent(attachment_id);
  if (variant === "thumbnail") return `/rest/api/3/attachment/thumbnail/${encoded_attachment_id}`;
  return `/rest/api/3/attachment/content/${encoded_attachment_id}`;
}
function getHeaderText(headers, key) {
  if (!headers) return "";
  const raw = headers[key];
  if (raw == null) return "";
  return String(raw).trim();
}
function requireJiraConfig() {
  const config = getJiraConfig();
  if (!config.jira_email_token || !config.jira_token) {
    throw new Error("faltan JIRA_EMAIL_TOKEN/EMAIL_TOKEN o JIRA_TOKEN en variables de entorno");
  }
  return { config, client: createJiraClient(config) };
}
async function jiraGetTasks(params) {
  const { config, client } = requireJiraConfig();
  const jql = buildRankedProjectJql(config.jira_project_key, params.jql || "");
  const start_at = parseIntParam(params.start_at, 0, 0, 1e6);
  const max_results = parseIntParam(params.max_results, 50, 1, 100);
  const include_description = parseBooleanParam(params.include_description, true);
  const fields = include_description ? "*all" : "*all,-description";
  return requestJira(client, {
    method: "GET",
    url: "/rest/api/3/search/jql",
    params: { jql, startAt: start_at, maxResults: max_results, fields }
  });
}
async function jiraGetTaskDetail(params) {
  const { client } = requireJiraConfig();
  const issue_key = params.issue_key.trim();
  if (!issue_key) throw new Error("issue_key es obligatorio");
  const include_description = parseBooleanParam(params.include_description, true);
  const fields = include_description ? "*all" : "*all,-description";
  return requestJira(client, {
    method: "GET",
    url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}`,
    params: { fields }
  });
}
async function jiraGetTransitions(params) {
  const { client } = requireJiraConfig();
  const issue_key = params.issue_key.trim();
  if (!issue_key) throw new Error("issue_key es obligatorio");
  return requestJira(client, {
    method: "GET",
    url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/transitions`
  });
}
async function jiraAddComment(params) {
  const { client } = requireJiraConfig();
  const issue_key = params.issue_key.trim();
  if (!issue_key) throw new Error("issue_key es obligatorio");
  const comment = params.comment.trim();
  if (!comment) throw new Error("comment es obligatorio");
  return requestJira(client, {
    method: "POST",
    url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/comment`,
    headers: { "Content-Type": "application/json" },
    data: { body: buildAdfText(comment) }
  });
}
async function jiraChangeStatus(params) {
  const { client } = requireJiraConfig();
  const issue_key = params.issue_key.trim();
  if (!issue_key) throw new Error("issue_key es obligatorio");
  let transition_id = (params.transition_id || "").trim();
  const to_status = (params.to_status || "").trim();
  if (!transition_id && !to_status) {
    throw new Error("debes enviar transition_id o to_status");
  }
  let transitions_data = null;
  if (!transition_id && to_status) {
    transitions_data = await requestJira(client, {
      method: "GET",
      url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/transitions`
    });
    const transitions = Array.isArray(transitions_data?.transitions) ? transitions_data.transitions : [];
    const found = transitions.find(
      (t) => (t?.name || "").toString().trim().toLowerCase() === to_status.toLowerCase()
    );
    if (!found) {
      throw new Error("to_status no encontrado entre transiciones disponibles");
    }
    transition_id = String(found.id || "");
  }
  await requestJira(client, {
    method: "POST",
    url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/transitions`,
    headers: { "Content-Type": "application/json" },
    data: { transition: { id: transition_id } }
  });
  const comment = (params.comment || "").trim();
  if (comment) {
    await requestJira(client, {
      method: "POST",
      url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/comment`,
      headers: { "Content-Type": "application/json" },
      data: { body: buildAdfText(comment) }
    });
  }
  if (!transitions_data) {
    transitions_data = await requestJira(client, {
      method: "GET",
      url: `/rest/api/3/issue/${encodeURIComponent(issue_key)}/transitions`
    });
  }
  return {
    issue_key,
    transition_id,
    next_available_transitions: transitions_data?.transitions || []
  };
}
async function jiraGetAttachmentData(params) {
  const { client } = requireJiraConfig();
  const attachment_id = String(params.attachment_id || "").trim();
  if (!attachment_id) throw new Error("attachment_id es obligatorio");
  const variant = params.variant === "thumbnail" ? "thumbnail" : "content";
  const response = await client.request({
    method: "GET",
    url: resolveAttachmentUrl(attachment_id, variant),
    responseType: "arraybuffer",
    headers: { Accept: "*/*" }
  });
  const response_headers = response.headers || {};
  const content_buffer = new Uint8Array(response.data);
  const content_type = getHeaderText(response_headers, "content-type") || "application/octet-stream";
  const cache_control = getHeaderText(response_headers, "cache-control");
  const etag = getHeaderText(response_headers, "etag");
  const last_modified = getHeaderText(response_headers, "last-modified");
  const length_from_header = Number(getHeaderText(response_headers, "content-length") || "0");
  const content_length = Number.isFinite(length_from_header) && length_from_header > 0 ? Math.floor(length_from_header) : content_buffer.byteLength;
  return {
    content_buffer,
    content_type,
    cache_control,
    content_length,
    etag,
    last_modified
  };
}

export { jiraGetTaskDetail as a, buildJiraErrorMessage as b, jiraChangeStatus as c, jiraAddComment as d, jiraGetTransitions as e, jiraGetTasks as f, jiraGetAttachmentData as j };
//# sourceMappingURL=jira-p2fuPwr_.js.map
