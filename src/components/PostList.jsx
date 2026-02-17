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

  const hasFilters = search.trim() || yearFilter || tagFilter;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="mb-8 space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search posts, tags, topics…"
            className="w-full border-b border-black/30 bg-transparent pb-2 pt-1 text-sm focus:outline-none focus:border-black placeholder:opacity-30 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-0 top-1 text-xs opacity-40 hover:opacity-80"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => { setTagFilter(""); setYearFilter(""); }}
            className={`text-[11px] uppercase tracking-[0.1em] border px-2 py-0.5 transition-colors duration-100 ${
              !tagFilter && !yearFilter
                ? "border-black bg-black text-white"
                : "border-black/30 hover:border-black hover:bg-black hover:text-white"
            }`}
          >
            All
          </button>
          {tags.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
              className={`text-[11px] uppercase tracking-[0.1em] border px-2 py-0.5 transition-colors duration-100 ${
                tagFilter === tag
                  ? "border-black bg-black text-white"
                  : "border-black/30 hover:border-black hover:bg-black hover:text-white"
              }`}
            >
              {tag} <span className="opacity-50">({count})</span>
            </button>
          ))}
          {years.length > 1 && years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setYearFilter(yearFilter === year ? "" : year)}
              className={`text-[11px] uppercase tracking-[0.1em] border px-2 py-0.5 transition-colors duration-100 ${
                yearFilter === year
                  ? "border-black bg-black text-white"
                  : "border-black/30 hover:border-black hover:bg-black hover:text-white"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </motion.div>

      {filteredPosts.length === 0 ? (
        <div className="py-16 border-t border-black/10">
          <p className="opacity-40 text-sm">No posts match this filter.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(""); setTagFilter(""); setYearFilter(""); }}
              className="mt-3 text-xs underline underline-offset-4 opacity-60 hover:opacity-100"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="border-t border-black/10">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              className="group border-b border-black/10 py-7"
              variants={cardMotion}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.08 }}
              custom={index}
            >
              <div className="flex items-start justify-between gap-4">
                <a href={`/blog/posts/${post.id}/`} className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-tight tracking-[-0.02em] group-hover:opacity-60 transition-opacity duration-200">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="mt-2 text-sm opacity-50 leading-relaxed max-w-xl">
                      {post.description}
                    </p>
                  )}
                </a>
                <a
                  href={`/blog/posts/${post.id}/`}
                  className="shrink-0 text-[11px] uppercase tracking-[0.1em] opacity-30 group-hover:opacity-70 transition-opacity duration-200 tabular-nums pt-1"
                >
                  {formatDate(post.pubDate)}
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                <span className="text-[11px] uppercase tracking-[0.1em] opacity-30">
                  {getReadingTime(post.content)} min read
                </span>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTagFilter(tag)}
                        className={`text-[11px] uppercase tracking-[0.08em] border px-2 py-0.5 transition-colors duration-100 ${
                          tagFilter === tag
                            ? "border-black bg-black text-white"
                            : "border-black/20 hover:border-black hover:bg-black hover:text-white"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </motion.div>
  );
}
