import { useState, useEffect, useCallback } from "react";

const REPO_OWNER = "martintomekvfx";
const REPO_NAME = "blog";
const POSTS_PATH = "src/content/posts";
const STORAGE_KEY = "blog_admin_token";

async function ghFetch(path, token, opts = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  return res.json();
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { attrs: {}, body: raw };
  const block = match[1];
  const attrs = {};
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("[")) {
      try {
        val = JSON.parse(val.replace(/'/g, '"'));
      } catch {
        val = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
      }
    }
    attrs[key] = val;
  }
  const body = raw.slice(match[0].length).trim();
  return { attrs, body };
}

function buildFrontmatter(attrs, body) {
  const lines = ["---"];
  for (const [key, val] of Object.entries(attrs)) {
    if (val === undefined || val === null) continue;
    if (typeof val === "boolean") lines.push(`${key}: ${val}`);
    else if (Array.isArray(val)) lines.push(`${key}: ${JSON.stringify(val)}`);
    else lines.push(`${key}: "${val}"`);
  }
  lines.push("---");
  lines.push("");
  lines.push(body);
  return lines.join("\n");
}

function LoginForm({ onLogin }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await ghFetch("", token.trim());
      onLogin(token.trim());
    } catch (err) {
      setError("Invalid token or no access to this repo.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold uppercase mb-8">Admin</h1>
      <form onSubmit={handleSubmit}>
        <label className="block text-sm uppercase mb-2" htmlFor="token">
          GitHub Personal Access Token
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_..."
          className="w-full bg-black text-white border border-white p-3 text-sm focus:outline-none mb-4"
        />
        {error && <p className="text-white mb-4 text-sm border border-white p-2 bg-white/10">{error}</p>}
        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="w-full border border-white px-4 py-2 text-sm uppercase font-medium bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 disabled:opacity-40"
        >
          {loading ? "Verifying..." : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-xs opacity-60">
        Token needs repo scope. Create one at GitHub Settings &gt; Developer settings &gt; Personal access tokens.
      </p>
    </div>
  );
}

function PostRow({ post, token, onRefresh }) {
  const [busy, setBusy] = useState(false);

  async function toggleDraft() {
    setBusy(true);
    try {
      const file = await ghFetch(`/contents/${post.path}`, token);
      const raw = atob(file.content);
      const { attrs, body } = parseFrontmatter(raw);
      attrs.draft = !attrs.draft;
      const updated = buildFrontmatter(attrs, body);
      await ghFetch(`/contents/${post.path}`, token, {
        method: "PUT",
        body: JSON.stringify({
          message: `blog: ${attrs.draft ? "unpublish" : "publish"} ${post.name}`,
          content: btoa(unescape(encodeURIComponent(updated))),
          sha: file.sha,
        }),
      });
      onRefresh();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setBusy(false);
  }

  async function deletePost() {
    if (!confirm(`Delete "${post.title}"?`)) return;
    setBusy(true);
    try {
      const file = await ghFetch(`/contents/${post.path}`, token);
      await ghFetch(`/contents/${post.path}`, token, {
        method: "DELETE",
        body: JSON.stringify({
          message: `blog: delete ${post.name}`,
          sha: file.sha,
        }),
      });
      onRefresh();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setBusy(false);
  }

  async function moveDate(days) {
    setBusy(true);
    try {
      const file = await ghFetch(`/contents/${post.path}`, token);
      const raw = atob(file.content);
      const { attrs, body } = parseFrontmatter(raw);
      const d = new Date(attrs.pubDate);
      d.setDate(d.getDate() + days);
      attrs.pubDate = d.toISOString().split("T")[0];
      const updated = buildFrontmatter(attrs, body);
      await ghFetch(`/contents/${post.path}`, token, {
        method: "PUT",
        body: JSON.stringify({
          message: `blog: reorder ${post.name}`,
          content: btoa(unescape(encodeURIComponent(updated))),
          sha: file.sha,
        }),
      });
      onRefresh();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setBusy(false);
  }

  const isDraft = post.draft;

  return (
    <div className={`border border-white p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${busy ? "opacity-40" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium truncate">{post.title}</span>
          {isDraft && (
            <span className="text-xs border border-white px-1.5 py-0.5 uppercase shrink-0">
              Draft
            </span>
          )}
        </div>
        <div className="text-xs opacity-60 mt-1 tabular-nums">
          {post.pubDate} &middot; {post.name}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => moveDate(1)}
          disabled={busy}
          className="border border-white px-2 py-1 text-xs hover:bg-white hover:text-black transition-colors duration-100"
          title="Move up (newer date)"
        >
          Up
        </button>
        <button
          onClick={() => moveDate(-1)}
          disabled={busy}
          className="border border-white px-2 py-1 text-xs hover:bg-white hover:text-black transition-colors duration-100"
          title="Move down (older date)"
        >
          Down
        </button>
        <button
          onClick={toggleDraft}
          disabled={busy}
          className="border border-white px-2 py-1 text-xs hover:bg-white hover:text-black transition-colors duration-100"
        >
          {isDraft ? "Publish" : "Hide"}
        </button>
        <button
          onClick={deletePost}
          disabled={busy}
          className="border border-white px-2 py-1 text-xs hover:bg-white hover:text-black transition-colors duration-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Dashboard({ token, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const files = await ghFetch(`/contents/${POSTS_PATH}`, token);
      const postList = [];
      for (const file of files) {
        if (!file.name.endsWith(".md") && !file.name.endsWith(".mdx")) continue;
        const content = await ghFetch(`/contents/${file.path}`, token);
        const raw = atob(content.content);
        const { attrs } = parseFrontmatter(raw);
        postList.push({
          name: file.name,
          path: file.path,
          sha: content.sha,
          title: attrs.title || file.name,
          pubDate: attrs.pubDate || "unknown",
          draft: attrs.draft === true,
          tags: attrs.tags || [],
        });
      }
      postList.sort((a, b) => (b.pubDate > a.pubDate ? 1 : -1));
      setPosts(postList);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold uppercase">Admin</h1>
        <button
          onClick={onLogout}
          className="text-xs uppercase underline underline-offset-4"
        >
          Log out
        </button>
      </div>

      {error && (
        <div className="border border-white p-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="opacity-60">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="opacity-60">No posts found.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <PostRow
              key={post.path}
              post={post}
              token={token}
              onRefresh={fetchPosts}
            />
          ))}
        </div>
      )}

      <p className="mt-8 text-xs opacity-60">
        Changes commit directly to the repo. Deploy triggers automatically.
      </p>
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || "";
    }
    return "";
  });

  function handleLogin(t) {
    localStorage.setItem(STORAGE_KEY, t);
    setToken(t);
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
  }

  if (!token) return <LoginForm onLogin={handleLogin} />;
  return <Dashboard token={token} onLogout={handleLogout} />;
}
