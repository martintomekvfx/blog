import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { marked } from "marked";

export default function PostView({ slug }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "posts", slug));
        if (snap.exists()) {
          const data = snap.data();
          if (data.draft) {
            setNotFound(true);
          } else {
            setPost(data);
          }
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
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

  const html = marked.parse(post.content || "");

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-balance mb-2">{post.title}</h1>
        <time className="block text-sm opacity-60 tabular-nums">
          {post.pubDate}
        </time>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag) => (
              <a
                key={tag}
                href={`/blog/tags/${tag}/`}
                className="text-xs border border-white px-2 py-0.5 hover:bg-white hover:text-black transition-colors duration-100"
              >
                {tag}
              </a>
            ))}
          </div>
        )}
      </header>
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
