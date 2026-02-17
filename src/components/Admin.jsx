import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

// --- Helpers ---

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SQUARE_POST_TEMPLATE = `# From Palmovka to Pixel Squares

Urban space is full of visual noise. I like to counter that with one clear signal.

<SquarePulse title="Palmovka signal" caption="A simple square used as a visual anchor in public-space interventions." />

## Why this matters

- A square can work like a tiny stage in the middle of chaos.
- Repetition builds recognition.
- Small visual gestures can re-activate neglected places.

## Process note

I document these interventions as part of a broader practice spanning film, VFX, tactical urbanism, and teaching.
`;

// --- Components ---

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onLogin();
    } catch {
      setError("Invalid email or password.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold uppercase mb-8">Admin</h1>
      <form onSubmit={handleSubmit}>
        <label className="block text-sm uppercase mb-2" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full bg-black text-white border border-white p-3 text-sm focus:outline-none mb-4"
        />
        <label className="block text-sm uppercase mb-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full bg-black text-white border border-white p-3 text-sm focus:outline-none mb-4"
        />
        {error && (
          <p className="mb-4 text-sm border border-white p-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full border border-white px-4 py-2 text-sm uppercase font-medium bg-white text-black hover:bg-black hover:text-white transition-colors duration-100 disabled:opacity-40"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}

function PostEditor({ post, onSave, onCancel }) {
  const isNew = !post;
  const [title, setTitle] = useState(post?.title || "");
  const [description, setDescription] = useState(post?.description || "");
  const [tags, setTags] = useState(
    post?.tags ? post.tags.join(", ") : ""
  );
  const [draft, setDraft] = useState(post?.draft ?? true);
  const [body, setBody] = useState(post?.content || "\nWrite your post here.\n");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function insertSquareTemplate() {
    setTitle("From Palmovka to Pixel Squares");
    setDescription("How a minimal square marker can reframe attention in public space.");
    setTags("process, tactical-urbanism, visual-language");
    setBody(SQUARE_POST_TEMPLATE);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");

    const slug = isNew ? slugify(title) : post.id;
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const data = {
      title: title.trim(),
      description: description.trim(),
      pubDate: post?.pubDate || new Date().toISOString().split("T")[0],
      tags: tagList,
      draft,
      content: body.trim(),
    };

    try {
      await setDoc(doc(db, "posts", slug), data);
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
          <div className="flex items-center justify-between gap-4 mb-1">
            <label className="block text-xs uppercase">Content (MDX)</label>
            <button
              type="button"
              onClick={insertSquareTemplate}
              className="text-[11px] uppercase underline underline-offset-4"
            >
              Insert square post template
            </button>
          </div>
          <p className="text-xs opacity-60 mb-2">
            You can use Markdown and JSX components, e.g. {"<CodePlayground code=\"console.log('hi')\" language=\"javascript\" />"} or {"<SquarePulse title=\"Signal\" />"}
          </p>
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

function PostRow({ post, onRefresh, onEdit }) {
  const [busy, setBusy] = useState(false);

  async function toggleDraft() {
    setBusy(true);
    try {
      const ref = doc(db, "posts", post.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await setDoc(ref, { ...snap.data(), draft: !post.draft });
      }
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
      await deleteDoc(doc(db, "posts", post.id));
      onRefresh();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setBusy(false);
  }

  async function moveDate(days) {
    setBusy(true);
    try {
      const ref = doc(db, "posts", post.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const d = new Date(data.pubDate);
        d.setDate(d.getDate() + days);
        await setDoc(ref, {
          ...data,
          pubDate: d.toISOString().split("T")[0],
        });
      }
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
          {post.pubDate} &middot; {post.id}
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

function Dashboard({ onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("list");
  const [editingPost, setEditingPost] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "posts"), orderBy("pubDate", "desc"));
      const snap = await getDocs(q);
      const postList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(postList);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

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
      <PostEditor onSave={handleSaved} onCancel={() => setView("list")} />
    );
  }

  if (view === "edit" && editingPost) {
    return (
      <PostEditor
        post={editingPost}
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
              key={post.id}
              post={post}
              onRefresh={fetchPosts}
              onEdit={() => handleEdit(post)}
            />
          ))}
        </div>
      )}

      <p className="mt-8 text-xs opacity-60">
        Changes are saved instantly. No rebuild needed.
      </p>
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  async function handleLogout() {
    await signOut(auth);
  }

  if (user === undefined) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <p className="opacity-60">Loading...</p>
      </div>
    );
  }

  if (!user) return <LoginForm onLogin={() => {}} />;
  return <Dashboard onLogout={handleLogout} />;
}
