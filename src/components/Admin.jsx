import { useState, useEffect, useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
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

const cmTheme = EditorView.theme({
  "&": {
    backgroundColor: "#0a0a0a !important",
    color: "#e8e8e8",
    fontSize: "13px",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, monospace',
    height: "100%",
  },
  "&.cm-editor": { backgroundColor: "#0a0a0a !important" },
  "&.cm-focused": { outline: "none" },
  ".cm-content": { padding: "16px", caretColor: "#fff", backgroundColor: "#0a0a0a" },
  ".cm-line": { lineHeight: "1.7" },
  ".cm-cursor": { borderLeftColor: "#fff" },
  ".cm-selectionBackground": { backgroundColor: "rgba(255,255,255,0.15) !important" },
  ".cm-gutters": { backgroundColor: "#0a0a0a !important", borderRight: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.2)" },
  ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.04)" },
  ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.03) !important" },
  ".cm-scroller": { overflow: "auto", backgroundColor: "#0a0a0a" },
}, { dark: true });

const GUIDE_CONTENT = `CONTEXT FOR AI WRITING ASSISTANT

You are writing for Martin Tomek's blog at martintomekvfx.github.io/blog.
Martin is an artist, VFX compositor, researcher, and educator based in Prague.
He works at FAMU and CAS (2025–2027). His practice: guerrilla art, public
interventions in Prague 8 (Palmovka), moving image, 16mm film, creative coding,
open-source tools, and tactical urbanism.

--- VOICE ---
- First person, direct, zero filler
- Short paragraphs, often 1–3 sentences
- Specific over general: name places, tools, exact numbers
- Process-forward: show the thinking, include the failures
- English for technical posts; Czech for personal/reflective writing
- Never open with "In this post I will..." or "I am excited to share..."
- No summary paragraph at the end
- Tone: honest, observational, a bit dry

--- FORMAT RULES (STRICT) ---
- NO bullet points or numbered lists — use prose paragraphs instead
- NO em dashes (—) — use commas, colons, or new sentences
- NO emoji or icons of any kind
- NO bold text for decoration — use bold only for code/tool names if needed
- NO blockquote walls — one short blockquote maximum per post

--- POST TYPES & LENGTH ---
Field note      150–400 words   A specific moment, observation, or finding
Process log     300–700 words   Step-by-step of how something was made
Research note   500–1200 words  Deeper analysis of a concept or problem
Tool post       400–800 words   How a specific tool or piece of code works

--- FRONTMATTER FORMAT ---
title: Short and specific — not generic
description: One sentence, no period at end
pubDate: YYYY-MM-DD
tags: (pick from list below)
draft: true

TAGS: process · urbanism · vfx · code · teaching · research
      game · analog · installation · palmovka · film · tools
      workshop · theory · open-source · behind-the-scenes

--- MARKDOWN FORMAT ---
Use ## for headings (not #)
Use fenced code blocks with language: \`\`\`python
Inline code with backticks
Blockquotes for key observations: > "..."

--- COMPONENT EMBEDS ---
<SquarePulse title="Signal" caption="What this marks." />
<CodePlayground code={\`your code here\`} language="javascript" />

--- STRONG OPENERS (examples) ---
"The square is 80×80 cm. I placed it and left."
"Three hours in, the projector died."
"This tool does one thing:"
"I have been placing markers in Prague 8 for six months."
"The frame rate was wrong. That turned out to be the whole point."

--- MARTIN'S ACTIVE PROJECTS ---
Palmovka interventions — minimal square markers in public space
FAMU teaching — workshops on process, tools, and perception
CAS research — attention and the urban environment (2025–2027)
VFX work — compositing, scanner experiments, analog+digital hybrids
Game jams — experimental, process-focused game development
Open tools — publishing small scripts and utilities

--- AVOID ---
"In this post I will explore..."
"I am excited to share..."
"As you can see..."
"In conclusion..."
Clichés about creativity or process
Summarizing what was just said`;

function GuidePanel({ onClose }) {
  const [copied, setCopied] = useState(false);

  function copyGuide() {
    navigator.clipboard.writeText(GUIDE_CONTENT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm bg-black border border-white/20 shadow-2xl flex flex-col" style={{ maxHeight: "calc(100vh - 2rem)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-[11px] uppercase tracking-[0.14em] opacity-60">Writing Guide</span>
          <div className="flex items-center gap-3">
            <button
              onClick={copyGuide}
              className="text-[11px] uppercase tracking-[0.1em] border border-white/20 px-2 py-0.5 hover:border-white/60 transition-colors"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button onClick={onClose} className="text-xs opacity-40 hover:opacity-100">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <pre className="text-[12px] leading-relaxed opacity-70 whitespace-pre-wrap font-sans">{GUIDE_CONTENT}</pre>
        </div>
      </div>
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
  const [showGuide, setShowGuide] = useState(false);
  const [editorMode, setEditorMode] = useState("write");
  const [publishStatus, setPublishStatus] = useState("");

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

      // If publishing (not a draft), trigger the tweet + newsletter workflow
      if (!draft) {
        const ghToken = localStorage.getItem("gh_dispatch_token");
        if (ghToken) {
          setPublishStatus("Triggering tweet + newsletter…");
          try {
            const r = await fetch(
              "https://api.github.com/repos/martintomekvfx/blog/actions/workflows/tweet.yml/dispatches",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${ghToken}`,
                  Accept: "application/vnd.github+json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ ref: "main" }),
              }
            );
            setPublishStatus(r.ok ? "✓ Tweet + newsletter queued" : `GitHub API error: ${r.status}`);
          } catch (dispatchErr) {
            setPublishStatus(`Dispatch failed: ${dispatchErr.message}`);
          }
        } else {
          setPublishStatus("No GH token — tweet not triggered (set it in Settings)");
        }
      }

      onSave();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(wordCount / 220));

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      {showGuide && <GuidePanel onClose={() => setShowGuide(false)} />}

      <div className="flex items-center justify-between px-0 py-4 border-b border-white/10 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="text-xs uppercase opacity-40 hover:opacity-100 transition-opacity"
          >
            ← Back
          </button>
          <h2 className="text-sm uppercase tracking-[0.1em] opacity-60">
            {isNew ? "New Post" : "Edit Post"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] uppercase tracking-[0.1em] border border-white/20 px-3 py-1.5 hover:border-white/60 transition-colors"
          >
            Writing Guide
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="border border-white px-4 py-1.5 text-xs uppercase font-medium bg-white text-black hover:bg-transparent hover:text-white transition-colors duration-100 disabled:opacity-40"
          >
            {saving ? "Saving…" : draft ? "Save Draft" : "Publish"}
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="w-full bg-transparent text-white border-b border-white/20 pb-2 text-2xl font-bold focus:outline-none focus:border-white/60 placeholder:opacity-20 transition-colors"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One-sentence description"
          className="w-full bg-transparent text-white/60 border-b border-white/10 pb-2 text-sm focus:outline-none focus:border-white/40 placeholder:opacity-20 transition-colors"
        />
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tags: process, vfx, urbanism"
            className="flex-1 min-w-48 bg-transparent text-white/50 border-b border-white/10 pb-1.5 text-xs focus:outline-none focus:border-white/30 placeholder:opacity-30 transition-colors"
          />
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none opacity-60 hover:opacity-100">
            <input
              type="checkbox"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
              className="accent-white"
            />
            Draft
          </label>
          <button
            type="button"
            onClick={insertSquareTemplate}
            className="text-[11px] uppercase tracking-[0.08em] opacity-40 hover:opacity-80 underline underline-offset-4"
          >
            Square template
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        {["write", "preview"].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setEditorMode(mode)}
            className={`text-[11px] uppercase tracking-[0.1em] pb-1 border-b transition-colors ${
              editorMode === mode ? "border-white opacity-100" : "border-transparent opacity-30 hover:opacity-60"
            }`}
          >
            {mode}
          </button>
        ))}
        <span className="ml-auto text-[11px] opacity-25 tabular-nums">
          {wordCount} words · {readMins} min read
        </span>
      </div>

      {editorMode === "write" ? (
        <div className="border border-white/15 overflow-hidden" style={{ minHeight: 480 }}>
          <CodeMirror
            value={body}
            onChange={(val) => setBody(val)}
            extensions={[markdown(), cmTheme]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: false,
              closeBrackets: false,
              autocompletion: false,
              rectangularSelection: false,
              crosshairCursor: false,
              highlightActiveLine: true,
              highlightSelectionMatches: false,
              closeBracketsKeymap: false,
              searchKeymap: false,
            }}
            style={{ minHeight: 480 }}
          />
        </div>
      ) : (
        <div
          className="border border-white/15 overflow-y-auto bg-white text-black"
          style={{ minHeight: 480 }}
        >
          <div
            className="prose prose-sm max-w-none p-6"
            dangerouslySetInnerHTML={{
              __html: body
                .replace(/^# (.+)$/gm, "<h1>$1</h1>")
                .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>")
                .replace(/`([^`]+)`/g, "<code>$1</code>")
                .replace(/^- (.+)$/gm, "<li>$1</li>")
                .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
                .replace(/\n\n/g, "</p><p>")
                .replace(/^(?!<[hpuol])(.+)$/gm, "<p>$1</p>"),
            }}
          />
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm border border-red-400/40 text-red-300 p-2">{error}</p>
      )}
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

function SettingsPanel({ onBack }) {
  const [token, setToken] = useState(() => localStorage.getItem("gh_dispatch_token") || "");
  const [saved, setSaved] = useState(false);

  function save() {
    if (token.trim()) {
      localStorage.setItem("gh_dispatch_token", token.trim());
    } else {
      localStorage.removeItem("gh_dispatch_token");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-xs uppercase opacity-40 hover:opacity-100">← Back</button>
        <h2 className="text-sm uppercase tracking-[0.1em] opacity-60">Settings</h2>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] opacity-60 mb-2">GitHub Dispatch Token</p>
          <p className="text-xs opacity-40 mb-3 leading-relaxed">
            A GitHub Personal Access Token with <code className="opacity-80">workflow</code> scope.
            Used to trigger the tweet + newsletter workflow when you publish a post.
            Stored in your browser only — never sent anywhere except GitHub API.
          </p>
          <p className="text-[11px] opacity-30 mb-3">
            Create at: github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens
            → Repository: martintomekvfx/blog → Permissions: Actions (read + write)
          </p>
          <input
            type="password"
            value={token}
            onChange={(e) => { setToken(e.target.value); setSaved(false); }}
            placeholder="github_pat_..."
            className="w-full bg-transparent border border-white/20 px-3 py-2 text-sm font-mono focus:outline-none focus:border-white/60 placeholder:opacity-20"
          />
          <button
            onClick={save}
            className="mt-3 border border-white px-4 py-1.5 text-xs uppercase font-medium bg-white text-black hover:bg-transparent hover:text-white transition-colors duration-100"
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
          {token && (
            <button
              onClick={() => { setToken(""); localStorage.removeItem("gh_dispatch_token"); }}
              className="mt-3 ml-3 text-xs uppercase opacity-40 hover:opacity-80"
            >
              Clear
            </button>
          )}
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-xs uppercase tracking-[0.14em] opacity-60 mb-2">How publishing works</p>
          <ol className="text-xs opacity-40 space-y-1.5 leading-relaxed list-decimal list-inside">
            <li>Write post, toggle Draft off, click Publish</li>
            <li>Post saved to Firebase instantly (live on site)</li>
            <li>GitHub Actions workflow triggered via API</li>
            <li>Workflow reads newest post from Firestore</li>
            <li>Tweets it + sends Buttondown newsletter email</li>
          </ol>
        </div>
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

  if (view === "settings") {
    return <SettingsPanel onBack={() => setView("list")} />;
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
            onClick={() => setView("settings")}
            className="text-xs uppercase opacity-40 hover:opacity-100 transition-opacity"
          >
            Settings
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
