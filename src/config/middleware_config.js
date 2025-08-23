// Safe API URL builder
const BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function api(path = '') {
  const p = String(path || '');
  if (/^https?:\/\//i.test(p)) return p;        // already absolute
  const clean = p.startsWith('/') ? p : `/${p}`;
  return `${BASE}${clean}`;
}

const config = {
  API_BASE: BASE,

  // Root / health
  ROOT_ROUTE: api('/'),

  // Auth
  AUTH_REGISTER_ROUTE: api('/api/register'),
  AUTH_LOGIN_ROUTE: api('/login'),

  // Users
  USERS_ROUTE: api('/users'),
  USER_BY_ID: (id) => api(`/users/${encodeURIComponent(id)}`),

  // Issues (lists)
  ISSUES_ROUTE: api('/issues'),
  ISSUES_BY_REPORTER_USERNAME: (username) =>
    api(`/issues?username=${encodeURIComponent(username)}`),
  ISSUES_BY_REPORTER_USERID: (userId) =>
    api(`/issues/user/${encodeURIComponent(userId)}`),
  ISSUES_ASSIGNED_TO_USERID: (userId) =>
    api(`/issues/assigned/${encodeURIComponent(userId)}`),
  ISSUES_ASSIGNED_TO_USERNAME: (username) =>
    api(`/issues/assigned/username/${encodeURIComponent(username)}`),

  // Issue actions / single
  ISSUE_ASSIGN: (issueId) => api(`/issues/${encodeURIComponent(issueId)}/assign`),
  ISSUE_CLOSE: (issueId) => api(`/issues/${encodeURIComponent(issueId)}/close`),
  ISSUE_UPDATE: (issueId) => api(`/issues/${encodeURIComponent(issueId)}/update`),
  ISSUE_BY_ID: (issueId) => api(`/issues/${encodeURIComponent(issueId)}`), // if implemented
  ISSUE_ATTACHMENT: (issueId) => api(`/issues/${encodeURIComponent(issueId)}/attachment`),

  // Conversations
  ISSUE_CONVERSATIONS: (issueId) => api(`/issues/${encodeURIComponent(issueId)}/conversations`),
  CONVERSATION_ATTACHMENT: (convId) => api(`/conversations/${encodeURIComponent(convId)}/attachment`),

  // Static files
  UPLOAD_FILE: (filename) => api(`/uploads/${encodeURIComponent(filename)}`)
};

export default config;
export { api };
