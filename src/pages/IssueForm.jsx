// SMS-ui/src/pages/issues/IssuesManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "https://juinbackend.vercel.app";

/* ---------- Try to hydrate current user from storage (no backend changes) ---------- */
function getStoredUser() {
  const tryParse = (v) => {
    try { return JSON.parse(v); } catch { return null; }
  };

  // Look through a few common keys you’ve used across modules
  const sources = [
    localStorage.getItem("sessionUser"),
    localStorage.getItem("auth"),
    localStorage.getItem("user"),
    sessionStorage.getItem("sessionUser"),
    sessionStorage.getItem("auth"),
    sessionStorage.getItem("user"),
  ].filter(Boolean);

  let found = null;
  for (const raw of sources) {
    const obj = tryParse(raw) || raw; // sometimes stored as plain string
    if (obj && typeof obj === "object") { found = obj; break; }
  }

  if (!found) return { userId: "", userName: "" };

  // Try several shapes you commonly use
  const userId =
    found.userid || found.userId || found.user_id || found.id || found.stuid || "";
  const userName =
    found.name ||
    found.fullname ||
    found.fullName ||
    found.username ||
    found.stuname ||
    "";

  return { userId: String(userId || ""), userName: String(userName || "") };
}

export default function IssuesManager() {
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({
    user_id: "",
    title: "",
    description: "",
    issue_type: "it",
    status: "open",
  });
  const [userName, setUserName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchIssues = async () => {
    try {
      const res = await axios.get(`${API}/issues`);
      setIssues(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      setMsg("Failed to fetch issues");
    }
  };

  // On mount: hydrate current user (if present) and fetch issues
  useEffect(() => {
    const { userId, userName } = getStoredUser();
    if (userId) {
      setForm((f) => ({ ...f, user_id: userId }));
      setUserName(userName || "");
    }
    fetchIssues();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("attachment", file);

      await axios.post(`${API}/issues`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("✅ Issue created successfully");
      setForm({
        user_id: form.user_id, // keep the same user id
        title: "",
        description: "",
        issue_type: "it",
        status: "open",
      });
      setFile(null);
      fetchIssues();
    } catch (err) {
      console.error(err?.response?.data || err.message);
      setMsg("❌ Failed to create issue: " + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const closeIssue = async (id) => {
    try {
      await axios.put(`${API}/issues/${id}/close`);
      fetchIssues();
    } catch (err) {
      console.error(err);
      alert("Failed to close issue");
    }
  };

  const hasAutoUser = Boolean(form.user_id);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl md:text-3xl font-semibold text-gray-800">
          📋 Issue Manager
        </h2>

        {/* Create Issue */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-800">Create New Issue</h3>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User ID (read-only if auto-fetched) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                name="user_id"
                placeholder="User ID"
                value={form.user_id}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  hasAutoUser ? "bg-gray-100 border-gray-200 text-gray-700" : "border-gray-300 bg-white"
                }`}
                required
                readOnly={hasAutoUser}
              />
              {hasAutoUser && (
                <p className="mt-1 text-xs text-gray-500">
                  Auto-filled from session. (Field locked)
                </p>
              )}
            </div>

            {/* User Name (read-only, informational) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
              <input
                type="text"
                value={userName}
                readOnly
                placeholder="(not available)"
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="Short, clear problem statement"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-rose-600">*</span>
              </label>
              <textarea
                name="description"
                placeholder="Describe the issue with steps, screenshots, etc."
                value={form.description}
                onChange={handleChange}
                className="h-28 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
              <select
                name="issue_type"
                value={form.issue_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="it">IT</option>
                <option value="student">Student</option>
                <option value="infrastructure">Infrastructure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="open">Open</option>
                <option value="allocated">Allocated</option>
                <option value="work in progress">Work in Progress</option>
                <option value="submitted back to owner">Submitted Back to Owner</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
              <input
                type="file"
                onChange={handleFile}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Create Issue"}
            </button>
          </div>

          {msg && (
            <div className="mt-3 text-sm">
              <span
                className={
                  msg.startsWith("✅")
                    ? "text-emerald-700"
                    : msg.startsWith("❌")
                    ? "text-rose-600"
                    : "text-gray-700"
                }
              >
                {msg}
              </span>
            </div>
          )}
        </form>

        {/* Issues List */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800">All Issues</h3>

          {issues.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No issues found</p>
          ) : (
            <div className="mt-3 space-y-3">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">{issue.title}</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        <b className="text-gray-800">ID:</b> {issue.id}{" "}
                        <span className="mx-2">&middot;</span>
                        <b className="text-gray-800">User:</b> {issue.user_id}
                        {issue.user_name ? (
                          <>
                            {" "}
                            <span className="mx-2">&middot;</span>
                            <b className="text-gray-800">Name:</b> {issue.user_name}
                          </>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        <b className="text-gray-800">Description:</b> {issue.description}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        <b className="text-gray-800">Type:</b> {issue.issue_type}{" "}
                        <span className="mx-2">&middot;</span>
                        <b className="text-gray-800">Status:</b>{" "}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            issue.status === "closed"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </p>

                      {issue.attachment && (
                        <a
                          href={`${API}/issues/${issue.id}/attachment`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-sm text-indigo-600 hover:underline"
                        >
                          📎 View Attachment
                        </a>
                      )}
                    </div>

                    <div className="shrink-0">
                      {issue.status !== "closed" && (
                        <button
                          onClick={() => closeIssue(issue.id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Close Issue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
