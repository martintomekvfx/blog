import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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



export default function PostView({ slug }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [MdxContent, setMdxContent] = useState(null);
  const [mdxError, setMdxError] = useState("");
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

            if (!cancelled) {
              setPost(data);
              if (compiled) {
                setMdxContent(() => compiled);
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

  return (
    <article className="post-view py-8">
      <a
        href="/blog/"
        className="text-sm opacity-50 hover:opacity-100 transition-opacity duration-150"
      >
        ← Writing
      </a>

      <header className="mt-8 mb-10">
        <h1 className="text-2xl font-semibold leading-snug mb-2">
          {post.title}
        </h1>
        <time className="text-sm opacity-40">{formattedDate}</time>
      </header>

      {mdxError ? (
        <div className="border border-black p-4 text-sm">
          <p className="font-medium mb-2">MDX Error</p>
          <p className="opacity-70">{mdxError}</p>
        </div>
      ) : MdxContent ? (
        <div ref={bodyRef} className="post-body prose prose-base max-w-none">
          <MdxContent components={mdxComponents} />
        </div>
      ) : (
        <p className="opacity-40 text-sm">Rendering…</p>
      )}
    </article>
  );
}
