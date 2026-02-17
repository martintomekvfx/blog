import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export default function TagsView({ tag }) {
  const [tags, setTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "posts"),
          where("draft", "==", false)
        );
        const snap = await getDocs(q);
        const allPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (tag) {
          const filtered = allPosts
            .filter((p) => p.tags && p.tags.includes(tag))
            .sort((a, b) => (b.pubDate > a.pubDate ? 1 : -1));
          setPosts(filtered);
        } else {
          const counts = {};
          for (const p of allPosts) {
            for (const t of p.tags || []) {
              counts[t] = (counts[t] || 0) + 1;
            }
          }
          const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
          setTags(sorted);
        }
      } catch {
        setTags([]);
        setPosts([]);
      }
      setLoading(false);
    }
    load();
  }, [tag]);

  if (loading) {
    return <p className="opacity-60">Loading...</p>;
  }

  if (tag) {
    return (
      <section>
        <h1 className="text-3xl font-bold text-balance mb-1">#{tag}</h1>
        <p className="opacity-60 mb-8">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
        {posts.length === 0 ? (
          <p className="opacity-60">No posts with this tag.</p>
        ) : (
          <div>
            {posts.map((post) => (
              <article key={post.id} className="border-b border-white/20 py-6">
                <a href={`/blog/posts/${post.id}/`} className="block group">
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
              </article>
            ))}
          </div>
        )}
        <a
          href="/blog/tags/"
          className="inline-block mt-8 text-sm underline underline-offset-4"
        >
          All tags
        </a>
      </section>
    );
  }

  return (
    <section>
      <h1 className="text-3xl font-bold text-balance mb-8">Tags</h1>
      {tags.length === 0 ? (
        <p className="opacity-60">No tags yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2" role="list">
          {tags.map(([t, count]) => (
            <li key={t}>
              <a
                href={`/blog/tags/${t}/`}
                className="inline-flex items-center gap-1.5 border border-white px-3 py-1.5 text-sm hover:bg-white hover:text-black transition-colors duration-100"
              >
                {t}
                <span className="text-xs opacity-60 tabular-nums">
                  {count}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
