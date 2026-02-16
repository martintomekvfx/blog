import { useState, useEffect, useCallback } from "react";

const REPO_OWNER = "martintomekvfx";
const REPO_NAME = "blog";
const POSTS_PATH = "src/content/posts";
const SESSION_KEY = "blog_admin_token";
const PERSIST_KEY = "blog_admin_persist";

// --- GitHub API ---

async function ghFetch(path, token, opts = {}) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`,
    {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        ...opts.headers,
      },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${res.status}`);
  }
  return res.json();
}

// --- Frontmatter ---

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
        val = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
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

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(str) {
  return decodeURIComponent(escape(atob(str)));
}

// --- Token storage (sessionStorage default, localStorage opt-in) ---

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return (
    sessionStorage.getItem(SESSION_KEY) ||
    localStorage.getItem(SESSION_KEY) ||
    ""
  );
}

function storeToken(token, persist) {
  sessionStorage.setItem(SESSION_KEY, token);
  if (persist) {
    localStorage.setItem(SESSION_KEY, token);
    localStorage.setItem(PERSIST_KEY, "1");
  }
}

function clearToken() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PERSIST_KEY);
}

// --- Components ---

function LoginForm({ onLogin }) {
  const [token, setToken] = useState("");
  const [persist, setPersist] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await ghFetch("", token.trim());
      // verify this token has access to the repo
      if (!user.permissions?.push && !user.permissions?.admin) {
        // for fine-grained tokens, permissions may not be on repo object
        // just verify we can list contents
        await ghFetch(`/contents/${POSTS_PATH}`, token.trim());
      }
      onLogin(token.trim(), persist);
    } catch {
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
          placeholder="github_pat_..."
          autoComplete="off"
          className="w-full bg-black text-white border border-white p-3 text-sm focus:outline-none mb-4"
        />
        <label className="flex items-center gap-2 mb-4 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={persist}
            onChange={(e) => setPersist(e.target.checked)}
            className="accent-white"
          />
          Remember me
        </label>
        {error && (
          <p className="mb-4 text-sm border border-white p-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="w-full border border-white px-4 py-2 text-sm uppercase font-medium bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 disabled:opacity-40"
        >
          {loading ? "Verifying..." : "Log in"}
        </button>
      </form>
      <div className="mt-8 text-xs opacity-60 space-y-2">
        <p>
          Use a fine-grained personal access token for best security:
        </p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>
            GitHub Settings &gt; Developer settings &gt; Fine-grained tokens
          </li>
          <li>Repository access: Only select &quot;{REPO_NAME}&quot;</li>
          <li>Permissions: Contents (Read and write)</li>
        </ol>
        <p>Token never leaves your browser. Stored in {persist ? "localStorage" : "sessionStorage"} only.</p>
      </div>
    </div>
  );
}

function PostEditor({ post, token, onSave, onCancel }) {
  const isNew = !post;
  const [title, setTitle] = useState(post?.title || "");
  const [description, setDescription] = useState(post?.description || "");
  const [tags, setTags] = useState(post?.tagsRaw || "");
  const [draft, setDraft] = useState(post?.draft ?? true);
  const [body, setBody] = useState(post?.body || "\nWrite your post here.\n");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");

    const slug = isNew ? slugify(title) : post.name.replace(/\.(md|mdx)$/, "");
    const filename = isNew ? `${slug}.md` : post.name;
    const path = `${POSTS_PATH}/${filename}`;

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const attrs = {
      title: title.trim(),
      description: description.trim(),
      pubDate: post?.pubDate || new Date().toISOString().split("T")[0],
      tags: tagList,
      draft,
    };

    const content = buildFrontmatter(attrs, body.trim());

    try {
      let sha;
      if (!isNew) {
        const existing = await ghFetch(`/contents/${path}`, token);
        sha = existing.sha;
      }

      await ghFetch(`/contents/${path}`, token, {
        method: "PUT",
        body: JSON.stringify({
          message: isNew
            ? `blog: create ${filename}`
            : `blog: update ${filename}`,
          content: toBase64(content),
          ...(sha ? { sha } : {}),
        }),
      });

      onSave();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold uppercase">
          {isNew ? "New Post" : "Edit Post"}
        </h2>
        <button
          onClick={onCancel}
          className="text-xs uppercase underline underline-offset-4"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black text-white border border-white p-3 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black text-white border border-white p-3 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="web, tutorial, astro"
            className="w-full bg-black text-white border border-white p-3 text-sm focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={draft}
            onChange={(e) => setDraft(e.target.checked)}
            className="accent-white"
          />
          Draft (hidden from public)
        </label>

        <div>
          <label className="block text-xs uppercase mb-1">Content (Markdown)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
            rows={20}
            className="w-full bg-black text-white border border-white p-3 text-sm font-mono focus:outline-none resize-y min-h-48"
          />
        </div>

        {error && (
          <p className="text-sm border border-white p-2">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="border border-white px-6 py-2 text-sm uppercase font-medium bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 disabled:opacity-40"
        >
          {saving ? "Saving..." : isNew ? "Create Post" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function PostRow({ post, token, onRefresh, onEdit }) {
  const [busy, setBusy] = useState(false);

  async function toggleDraft() {
    setBusy(true);
    try {
      const file = await ghFetch(`/contents/${post.path}`, token);
      const raw = fromBase64(file.content);
      const { attrs, body } = parseFrontmatter(raw);
      attrs.draft = !attrs.draft;
      const updated = buildFrontmatter(attrs, body);
      await ghFetch(`/contents/${post.path}`, token, {
        method: "PUT",
        body: JSON.stringify({
          message: `blog: ${attrs.draft ? "unpublish" : "publish"} ${post.name}`,
          content: toBase64(updated),
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
      const raw = fromBase64(file.content);
      const { attrs, body } = parseFrontmatter(raw);
      const d = new Date(attrs.pubDate);
      d.setDate(d.getDate() + days);
      attrs.pubDate = d.toISOString().split("T")[0];
      const updated = buildFrontmatter(attrs, body);
      await ghFetch(`/contents/${post.path}`, token, {
        method: "PUT",
        body: JSON.stringify({
          message: `blog: reorder ${post.name}`,
          content: toBase64(updated),
          sha: file.sha,
        }),
      });
      onRefresh();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setBusy(false);
  }

  return (
    <div
      className={`border border-white p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${busy ? "opacity-40" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium truncate">{post.title}</span>
          {post.draft && (
            <span className="text-xs border border-white px-1.5 py-0.5 uppercase shrink-0">
              Draft
            </span>
          )}
        </div>
        <div className="text-xs opacity-60 mt-1 tabular-nums">
          {post.pubDate} &middot; {post.name}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
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
          onClick={onEdit}
          disabled={busy}
          className="border border-white px-2 py-1 text-xs hover:bg-white hover:text-black transition-colors duration-100"
        >
          Edit
        </button>
        <button
          onClick={toggleDraft}
          disabled={busy}
          className="border border-white px-2 py-1 text-xs hover:bg-white hover:text-black transition-colors duration-100"
        >
          {post.draft ? "Publish" : "Hide"}
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
  const [view, setView] = useState("list"); // list | new | edit
  const [editingPost, setEditingPost] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const files = await ghFetch(`/contents/${POSTS_PATH}`, token);
      const postList = [];
      for (const file of files) {
        if (!file.name.endsWith(".md") && !file.name.endsWith(".mdx")) continue;
        const content = await ghFetch(`/contents/${file.path}`, token);
        const raw = fromBase64(content.content);
        const { attrs, body } = parseFrontmatter(raw);
        postList.push({
          name: file.name,
          path: file.path,
          sha: content.sha,
          title: attrs.title || file.name,
          description: attrs.description || "",
          pubDate: attrs.pubDate || "unknown",
          draft: attrs.draft === true,
          tags: attrs.tags || [],
          tagsRaw: Array.isArray(attrs.tags) ? attrs.tags.join(", ") : "",
          body,
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

  function handleEdit(post) {
    setEditingPost(post);
    setView("edit");
  }

  function handleSaved() {
    setView("list");
    setEditingPost(null);
    fetchPosts();
  }

  if (view === "new") {
    return (
      <PostEditor
        token={token}
        onSave={handleSaved}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "edit" && editingPost) {
    return (
      <PostEditor
        post={editingPost}
        token={token}
        onSave={handleSaved}
        onCancel={() => {
          setView("list");
          setEditingPost(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold uppercase">Admin</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView("new")}
            className="border border-white px-3 py-1.5 text-xs uppercase font-medium bg-white text-black hover:bg-black hover:text-white transition-colors duration-100"
          >
            New Post
          </button>
          <button
            onClick={onLogout}
            className="text-xs uppercase underline underline-offset-4"
          >
            Log out
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-white p-3 mb-6 text-sm">{error}</div>
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
              onEdit={() => handleEdit(post)}
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
  const [token, setToken] = useState(() => getStoredToken());

  function handleLogin(t, persist) {
    storeToken(t, persist);
    setToken(t);
  }

  function handleLogout() {
    clearToken();
    setToken("");
  }

  if (!token) return <LoginForm onLogin={handleLogin} />;
  return <Dashboard token={token} onLogout={handleLogout} />;
}
