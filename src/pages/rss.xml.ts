import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(context: APIContext) {
  let posts: {
    id: string;
    title: string;
    description: string;
    pubDate: Date;
  }[] = [];

  try {
    const snap = await getDocs(
      query(collection(db, "posts"), where("draft", "==", false))
    );

    posts = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      const parsedDate = new Date(data.pubDate || "");

      return {
        id: docSnap.id,
        title: String(data.title || "Untitled"),
        description: String(data.description || ""),
        pubDate: Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      };
    });
  } catch {
    posts = [];
  }

  const sorted = posts.sort(
    (a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()
  );

  return rss({
    title: "Blog",
    description: "A tech & art blog",
    site: context.site!,
    items: sorted.map((post) => ({
      title: post.title,
      pubDate: post.pubDate,
      description: post.description,
      link: `/blog/posts/${post.id}/`,
    })),
  });
}
