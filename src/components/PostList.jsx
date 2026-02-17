import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

function parseDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const parsed = parseDate(value);
  if (!parsed) return value || "";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getReadingTime(text) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

const cardMotion = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");
    const initialYear = params.get("year");
    const initialTag = params.get("tag");
    if (initialQuery) {
      setSearch(initialQuery);
    }
    if (initialYear) {
      setYearFilter(initialYear);
    }
    if (initialTag) {
      setTagFilter(initialTag);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (search.trim()) {
      url.searchParams.set("q", search.trim());
    } else {
      url.searchParams.delete("q");
    }
    if (yearFilter) {
      url.searchParams.set("year", yearFilter);
    } else {
      url.searchParams.delete("year");
    }
    if (tagFilter) {
      url.searchParams.set("tag", tagFilter);
    } else {
      url.searchParams.delete("tag");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [search, yearFilter, tagFilter]);

  const years = useMemo(() => {
    const values = new Set();
    for (const post of posts) {
      const parsed = parseDate(post.pubDate);
      if (parsed) {
        values.add(String(parsed.getFullYear()));
      }
    }
    return [...values].sort((a, b) => Number(b) - Number(a));
  }, [posts]);

  const tags = useMemo(() => {
    const counts = new Map();

    for (const post of posts) {
      for (const tag of Array.isArray(post.tags) ? post.tags : []) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }

    return [...counts.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const queryText = search.trim().toLowerCase();

    return posts.filter((post) => {
      const parsed = parseDate(post.pubDate);
      const matchesYear =
        yearFilter === "" || (parsed && String(parsed.getFullYear()) === yearFilter);
      const matchesTag =
        tagFilter === "" ||
        (Array.isArray(post.tags) && post.tags.includes(tagFilter));

      if (!matchesYear || !matchesTag) return false;

      if (!queryText) return true;

      const searchable = [
        post.title,
        post.description,
        Array.isArray(post.tags) ? post.tags.join(" ") : "",
        post.content,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return searchable.includes(queryText);
    });
  }, [posts, search, yearFilter, tagFilter]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="mb-6 space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <label className="block">
          <span className="sr-only">Search posts</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search posts, tags, topics..."
            className="w-full border border-black bg-white px-3 py-2 text-sm focus:outline-none"
          />
        </label>

        {years.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setYearFilter("")}
              className={`text-xs border px-2 py-0.5 transition-colors duration-100 ${
                yearFilter === ""
                  ? "border-black bg-black text-white"
                  : "border-black hover:bg-black hover:text-white"
              }`}
            >
              All years
            </button>
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setYearFilter(year)}
                className={`text-xs border px-2 py-0.5 transition-colors duration-100 ${
                  yearFilter === year
                    ? "border-black bg-black text-white"
                    : "border-black hover:bg-black hover:text-white"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTagFilter("")}
              className={`text-xs border px-2 py-0.5 transition-colors duration-100 ${
                tagFilter === ""
                  ? "border-black bg-black text-white"
                  : "border-black hover:bg-black hover:text-white"
              }`}
            >
              All topics
            </button>
            {tags.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter(tag)}
                className={`text-xs border px-2 py-0.5 transition-colors duration-100 ${
                  tagFilter === tag
                    ? "border-black bg-black text-white"
                    : "border-black hover:bg-black hover:text-white"
                }`}
              >
                {tag} <span className="opacity-60">({count})</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 border-y border-black/20">
          <p className="opacity-60">No posts match this filter.</p>
        </div>
      ) : (
        filteredPosts.map((post) => (
          <motion.article
            key={post.id}
            className="border-b border-black/20 py-6"
            variants={cardMotion}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.12 }}
          >
            <a
              href={`/blog/posts/${post.id}/`}
              className="block group"
            >
              <h2 className="text-xl font-bold text-balance group-hover:underline underline-offset-4">
                {post.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.08em] opacity-60">
                <time className="tabular-nums">{formatDate(post.pubDate)}</time>
                <span>{getReadingTime(post.content)} min read</span>
              </div>
              {post.description && (
                <p className="mt-2 text-pretty opacity-80">
                  {post.description}
                </p>
              )}
            </a>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTagFilter(tag)}
                    className="text-xs border border-black px-2 py-0.5 hover:bg-black hover:text-white transition-colors duration-100"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </motion.article>
        ))
      )}
    </motion.div>
  );
}
