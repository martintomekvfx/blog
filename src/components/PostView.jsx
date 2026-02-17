import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import CodePlayground from "./CodePlayground.jsx";
import SquarePulse from "./SquarePulse.jsx";

const mdxComponents = {
  CodePlayground,
  SquarePulse,
};

function normalizeMdxSource(source) {
  let text = String(source || "").replace(/\r\n/g, "\n");

  if (text.startsWith("---")) {
    const end = text.indexOf("\n---\n", 3);
    if (end !== -1) {
      text = text.slice(end + 5);
    }
  }

  const lines = text.split("\n");
  const cleaned = [];
  let stripImports = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (stripImports) {
      if (line === "") {
        cleaned.push(rawLine);
        continue;
      }
      if (line.startsWith("import ") || line.startsWith("export ")) {
        continue;
      }
      stripImports = false;
    }
    cleaned.push(rawLine);
  }

  return cleaned.join("\n");
}

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getReadingTime(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function extractToc(mdxSource) {
  const lines = (mdxSource || "").split("\n");
  const headings = [];
  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      const level = m[1].length;
      const text = m[2].replace(/[*_`]/g, "").trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      headings.push({ level, text, id });
    }
  }
  return headings;
}

function TableOfContents({ headings }) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0% -70% 0%" }
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <motion.nav
      className="mb-8 border border-black/10 p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] opacity-40 mb-3">Contents</p>
      <ol className="space-y-1">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? "1rem" : 0 }}>
            <a
              href={`#${h.id}`}
              className={`text-sm transition-opacity duration-150 hover:opacity-100 ${
                active === h.id ? "opacity-100 font-medium" : "opacity-40"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </motion.nav>
  );
}

export default function PostView({ slug }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [MdxContent, setMdxContent] = useState(null);
  const [mdxError, setMdxError] = useState("");
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [toc, setToc] = useState([]);
  const bodyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setPost(null);
      setMdxContent(null);
      setMdxError("");
      setRelatedPosts([]);

      try {
        const snap = await getDoc(doc(db, "posts", slug));
        if (snap.exists()) {
          const data = snap.data();
          if (data.draft) {
            if (!cancelled) setNotFound(true);
          } else {
            const normalizedSource = normalizeMdxSource(data.content || "");
            let compiled = null;
            let related = [];

            try {
              const module = await evaluate(normalizedSource, {
                ...runtime,
                baseUrl: import.meta.url,
              });
              compiled = module.default;
            } catch (err) {
              if (!cancelled) {
                setMdxError(err?.message || "Invalid MDX syntax.");
              }
            }

            try {
              const q = query(collection(db, "posts"), where("draft", "==", false));
              const relatedSnap = await getDocs(q);
              const currentTags = Array.isArray(data.tags) ? data.tags : [];

              related = relatedSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((candidate) => candidate.id !== slug)
                .map((candidate) => {
                  const candidateTags = Array.isArray(candidate.tags) ? candidate.tags : [];
                  const score = candidateTags.filter((tag) => currentTags.includes(tag)).length;
                  return { ...candidate, _score: score };
                })
                .filter((candidate) => candidate._score > 0)
                .sort((a, b) => {
                  if (b._score !== a._score) return b._score - a._score;
                  const aTime = Date.parse(a.pubDate || "");
                  const bTime = Date.parse(b.pubDate || "");
                  return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
                })
                .slice(0, 3);
            } catch {
              related = [];
            }

            if (!cancelled) {
              setPost(data);
              if (compiled) {
                setMdxContent(() => compiled);
              }
              setRelatedPosts(related);
              const wordCount = (data.content || "").trim().split(/\s+/).filter(Boolean).length;
              if (wordCount > 800) {
                setToc(extractToc(data.content || ""));
              }
            }
          }
        } else {
          if (!cancelled) setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!bodyRef.current) return;
    const blocks = bodyRef.current.querySelectorAll("pre");
    for (const pre of blocks) {
      if (pre.querySelector(".copy-btn")) continue;
      const btn = document.createElement("button");
      btn.textContent = "Copy";
      btn.className = "copy-btn";
      btn.addEventListener("click", () => {
        const code = pre.querySelector("code");
        navigator.clipboard.writeText(code ? code.innerText : pre.innerText).then(() => {
          btn.textContent = "Copied";
          setTimeout(() => { btn.textContent = "Copy"; }, 1800);
        });
      });
      pre.style.position = "relative";
      pre.appendChild(btn);
    }

    const headings = bodyRef.current.querySelectorAll("h2, h3");
    for (const h of headings) {
      if (!h.id) {
        h.id = h.textContent.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      }
    }
  }, [MdxContent]);

  if (loading) {
    return <p className="opacity-60">Loading...</p>;
  }

  if (notFound) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold uppercase mb-4">404</h1>
        <p className="opacity-60 mb-8">Post not found.</p>
        <a href="/blog/" className="text-sm underline underline-offset-4">
          Back to home
        </a>
      </div>
    );
  }

  const formattedDate = formatDate(post.pubDate);
  const readingMinutes = getReadingTime(post.content);

  return (
    <motion.article
      className="post-view pb-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.a
        href="/blog/"
        className="inline-block text-xs uppercase underline underline-offset-4 opacity-80 hover:opacity-100"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
      >
        Back to home
      </motion.a>

      <motion.header
        className="mt-5 mb-10 border-y border-black/30 py-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.1 }}
      >
        <p className="text-xs uppercase tracking-[0.14em] opacity-60 mb-4">Article</p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-balance mb-3">
          {post.title}
        </h1>
        {post.description && (
          <p className="text-base sm:text-lg text-pretty opacity-80 max-w-2xl">
            {post.description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-[0.12em] opacity-60">
          <time className="tabular-nums">{formattedDate}</time>
          <span>{readingMinutes} min read</span>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <a
                key={tag}
                href={`/blog/?tag=${encodeURIComponent(tag)}`}
                className="text-xs border border-black px-2 py-0.5 hover:bg-black hover:text-white transition-colors duration-100"
              >
                {tag}
              </a>
            ))}
          </div>
        )}
      </motion.header>
      {toc.length > 0 && <TableOfContents headings={toc} />}

      {mdxError ? (
        <div className="border border-black p-4 text-sm">
          <p className="font-medium uppercase mb-2">MDX Render Error</p>
          <p className="opacity-80">{mdxError}</p>
        </div>
      ) : MdxContent ? (
        <div ref={bodyRef} className="post-body prose prose-lg max-w-none">
          <MdxContent components={mdxComponents} />
        </div>
      ) : (
        <p className="opacity-60">Rendering post...</p>
      )}

      {relatedPosts.length > 0 && (
        <motion.section
          className="mt-12 border-t border-black/20 pt-8"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h2 className="text-xl font-bold uppercase tracking-[0.06em] mb-4">Related articles</h2>
          <div>
            {relatedPosts.map((related) => (
              <article key={related.id} className="border-b border-black/20 py-4">
                <a href={`/blog/posts/${related.id}/`} className="group block">
                  <h3 className="text-lg font-bold group-hover:underline underline-offset-4">
                    {related.title}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.08em] opacity-60 mt-1">
                    {formatDate(related.pubDate)}
                  </p>
                  {related.description && (
                    <p className="mt-2 text-sm opacity-80 text-pretty">{related.description}</p>
                  )}
                </a>
              </article>
            ))}
          </div>
        </motion.section>
      )}
    </motion.article>
  );
}
