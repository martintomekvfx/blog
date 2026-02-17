import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import CodePlayground from "./CodePlayground.jsx";

const mdxComponents = {
  CodePlayground,
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

export default function PostView({ slug }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [MdxContent, setMdxContent] = useState(null);
  const [mdxError, setMdxError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setPost(null);
      setMdxContent(null);
      setMdxError("");

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
    <article className="post-view pb-10">
      <a
        href="/blog/"
        className="inline-block text-xs uppercase underline underline-offset-4 opacity-80 hover:opacity-100"
      >
        Back to home
      </a>

      <header className="mt-5 mb-10 border-y border-black/30 py-8">
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
                href={`/blog/tags/${tag}/`}
                className="text-xs border border-black px-2 py-0.5 hover:bg-black hover:text-white transition-colors duration-100"
              >
                {tag}
              </a>
            ))}
          </div>
        )}
      </header>
      {mdxError ? (
        <div className="border border-black p-4 text-sm">
          <p className="font-medium uppercase mb-2">MDX Render Error</p>
          <p className="opacity-80">{mdxError}</p>
        </div>
      ) : MdxContent ? (
        <div className="post-body prose prose-lg max-w-none">
          <MdxContent components={mdxComponents} />
        </div>
      ) : (
        <p className="opacity-60">Rendering post...</p>
      )}
    </article>
  );
}
