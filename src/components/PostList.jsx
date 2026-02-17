import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "posts"), where("draft", "==", false));
        const snap = await getDocs(q);
        const publishedPosts = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aTime = Date.parse(a.pubDate || "");
            const bTime = Date.parse(b.pubDate || "");
            return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
          });
        setPosts(publishedPosts);
        setError("");
      } catch (err) {
        setPosts([]);
        setError("Could not load posts. " + (err?.message || ""));
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <p className="opacity-60">Loading posts...</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="opacity-60">{error || "No posts yet."}</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id} className="border-b border-black/20 py-6">
          <a
            href={`/blog/posts/${post.id}/`}
            className="block group"
          >
            <h2 className="text-xl font-bold text-balance group-hover:underline underline-offset-4">
              {post.title}
            </h2>
            <time className="block text-sm opacity-60 mt-1 tabular-nums">
              {post.pubDate}
            </time>
            {post.description && (
              <p className="mt-2 text-pretty opacity-80">
                {post.description}
              </p>
            )}
          </a>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
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
        </article>
      ))}
    </div>
  );
}
