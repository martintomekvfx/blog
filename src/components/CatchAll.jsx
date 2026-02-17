import { useState, useEffect } from "react";
import PostView from "./PostView.jsx";

export default function CatchAll() {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    const postMatch = path.match(/^\/blog\/posts\/([^/]+)\/?$/);
    const tagMatch = path.match(/^\/blog\/tags\/([^/]+)\/?$/);

    if (postMatch) {
      setRoute({ type: "post", slug: decodeURIComponent(postMatch[1]) });
    } else if (tagMatch) {
      const tag = decodeURIComponent(tagMatch[1]);
      window.location.replace(`/blog/?tag=${encodeURIComponent(tag)}`);
    } else {
      setRoute({ type: "404" });
    }
  }, []);

  if (!route) return <p className="opacity-60">Loading...</p>;

  if (route.type === "post") {
    return <PostView slug={route.slug} />;
  }

  return (
    <div className="text-center py-16">
      <h1 className="text-3xl font-bold uppercase mb-4">404</h1>
      <p className="opacity-60 mb-8">Page not found.</p>
      <a href="/blog/" className="text-sm underline underline-offset-4">
        Back to home
      </a>
    </div>
  );
}
