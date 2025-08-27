import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "https://juinbackend.vercel.app";

export default function IssuesManager() {
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({
    user_id: "",
    title: "",
    description: "",
    issue_type: "it",
    status: "open",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Fetch all issues
  const fetchIssues = async () => {
    try {
      const res = await axios.get(`${API}/issues`);
      setIssues(res.data.data || res.data);
    } catch (err) {
      console.error(err);
      setMsg("Failed to fetch issues");
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle file
  const handleFile = (e) => {
    setFile(e.target.files[0]);
  };

  // Submit new issue
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("attachment", file);

      const res = await axios.post(`${API}/issues`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("✅ Issue created successfully");
      setForm({ user_id: "", title: "", description: "", issue_type: "it", status: "open" });
      setFile(null);
      fetchIssues();
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMsg("❌ Failed to create issue: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Close issue
  const closeIssue = async (id) => {
    try {
      await axios.put(`${API}/issues/${id}/close`);
      fetchIssues();
    } catch (err) {
      console.error(err);
      alert("Failed to close issue");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2 style={{ textAlign: "center" }}>📋 Issue Manager</h2>

      {/* Create Issue Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          border: "1px solid #ccc",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>Create New Issue</h3>

        <input
          type="number"
          name="user_id"
          placeholder="User ID"
          value={form.user_id}
          onChange={handleChange}
          style={{ display: "block", margin: "8px 0", padding: "8px", width: "100%" }}
          required
        />
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          style={{ display: "block", margin: "8px 0", padding: "8px", width: "100%" }}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          style={{ display: "block", margin: "8px 0", padding: "8px", width: "100%" }}
          required
        />
        <select
          name="issue_type"
          value={form.issue_type}
          onChange={handleChange}
          style={{ display: "block", margin: "8px 0", padding: "8px", width: "100%" }}
        >
          <option value="it">IT</option>
          <option value="student">Student</option>
          <option value="infrastructure">Infrastructure</option>
        </select>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          style={{ display: "block", margin: "8px 0", padding: "8px", width: "100%" }}
        >
          <option value="open">Open</option>
          <option value="allocated">Allocated</option>
          <option value="work in progress">Work in Progress</option>
          <option value="submitted back to owner">Submitted Back to Owner</option>
          <option value="closed">Closed</option>
        </select>
        <input type="file" onChange={handleFile} style={{ margin: "8px 0" }} />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#28a745",
            color: "#fff",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {loading ? "Saving..." : "Create Issue"}
        </button>
      </form>

      {msg && <p>{msg}</p>}

      {/* Issues List */}
      <h3>All Issues</h3>
      {issues.length === 0 ? (
        <p>No issues found</p>
      ) : (
        <div>
          {issues.map((issue) => (
            <div
              key={issue.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "6px",
                padding: "10px",
                margin: "10px 0",
              }}
            >
              <h4>{issue.title}</h4>
              <p><b>ID:</b> {issue.id} | <b>User:</b> {issue.user_id}</p>
              <p><b>Description:</b> {issue.description}</p>
              <p><b>Type:</b> {issue.issue_type} | <b>Status:</b> {issue.status}</p>
              {issue.attachment && (
                <a
                  href={`${API}/issues/${issue.id}/attachment`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "blue" }}
                >
                  📎 View Attachment
                </a>
              )}
              <div style={{ marginTop: "10px" }}>
                {issue.status !== "closed" && (
                  <button
                    onClick={() => closeIssue(issue.id)}
                    style={{
                      background: "red",
                      color: "white",
                      padding: "5px 10px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginRight: "10px",
                    }}
                  >
                    Close Issue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
