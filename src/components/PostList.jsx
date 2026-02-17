import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

function formatDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "posts"), where("draft", "==", false));
        const snap = await getDocs(q);
        const sorted = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aTime = Date.parse(a.pubDate || "");
            const bTime = Date.parse(b.pubDate || "");
            return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
          });
        setPosts(sorted);
      } catch (err) {
        setError("Could not load posts.");
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="opacity-40 text-sm">Loading…</p>;
  if (error) return <p className="opacity-40 text-sm">{error}</p>;
  if (posts.length === 0) return <p className="opacity-40 text-sm">No posts yet.</p>;

  return (
    <div>
      <p className="text-sm font-medium mb-6">Writing</p>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <a
              href={`/blog/posts/${post.id}/`}
              className="group flex items-baseline justify-between gap-4 py-2 hover:opacity-60 transition-opacity duration-150"
            >
              <span className="text-base">{post.title}</span>
              <span className="shrink-0 text-sm opacity-40 tabular-nums">{formatDate(post.pubDate)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
