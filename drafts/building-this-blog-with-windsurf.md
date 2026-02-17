---
title: Building This Blog With Windsurf
description: How I built a full-stack blog with admin panel, newsletter, and auto-deploy in two evenings using an AI IDE
pubDate: 2026-02-17
tags: [process, code, tools, behind-the-scenes]
draft: false
---

I already have a portfolio. But the portfolio is an archive of finished things. I wanted a place for the rest: working processes, failed attempts, tools I have been using, thoughts that do not belong anywhere else. Something closer to a notebook than a gallery. So I built this site.

## The idea

I was looking at benji.org and emilkowal.ski. Both do the same thing: get out of the way. Clean type, no decoration, content is the only thing on the page. That was the aesthetic I wanted to copy.

The requirements were simple. A real admin panel I can open from any browser and write in. Posts stored in a database, not committed to git as files. Automatic deploy to GitHub Pages on push. A newsletter that goes out when I publish. Nothing to run, nothing to pay monthly.

## The stack

The site is built with Astro, with React for the interactive parts: the post list, the post viewer, and the admin panel. Posts live in Firebase Firestore. The admin uses Firebase Auth for single-user login. The editor inside the admin is CodeMirror with markdown support.

Posts are written in MDX, which means they can embed custom React components directly in the content. The styling is Tailwind with Geist font from Vercel. Deployment is GitHub Pages, with GitHub Actions handling both CI/CD and newsletter dispatch.

Here is the Firestore query that generates post pages at build time:

```javascript
const snap = await getDocs(
  query(collection(db, "posts"), where("draft", "==", false))
);

return snap.docs.map((docSnap) => ({
  params: { slug: docSnap.id },
  props: { slug: docSnap.id, ...docSnap.data() },
}));
```

When a post is published, the admin triggers a GitHub Actions workflow via the GitHub API. The workflow fetches the latest post from Firestore and sends the newsletter through Buttondown.

```javascript
await fetch(
  `https://api.github.com/repos/${owner}/${repo}/dispatches`,
  {
    method: "POST",
    headers: {
      Authorization: `token ${ghToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({ event_type: "publish-post" }),
  }
);
```

For the newsletter I am using Buttondown for now. It was the fastest thing to wire up and the free tier covers everything at this scale. The plan is to eventually move to a fully self-hosted setup, but Buttondown made sense to start with.

## Vibe coding

There is a term going around: vibe coding. The idea is that you describe what you want, an AI builds it, you iterate. You do not write code so much as direct it.

I have mixed feelings about the framing. It makes the process sound casual in a way that undersells the actual work. When something breaks, you still have to understand why. When the AI proposes something wrong, you have to recognize it. The gap between idea and working implementation is smaller, but the gap is not zero.

For this blog, I would describe something like: add a settings panel to the admin where I can store the GitHub dispatch token. Cascade would read Admin.jsx, write the component, apply the edit, confirm. If the build failed, it would read the error and fix it. The conversation was about intent rather than syntax.

The honest version is that I spent most of the time deciding what I wanted, not writing code. That is a different kind of work, but it is still work.

## What worked

The admin panel came together quickly. Firebase Auth, Firestore storage, CodeMirror editor, all wired together in one session. The newsletter pipeline works end to end: write, hit publish, newsletter out. No manual steps.

Debugging was faster than usual. A React hooks ordering error that would have taken me an hour to trace was diagnosed and fixed in one exchange. A Firestore REST API query that silently failed because the API key needed to be a query parameter rather than a header took about five minutes.

## What did not work

Twitter's API is now credit-based. Even on a new developer account, the first API call returned `CreditsDepleted`. The auto-tweet feature is built and wired. It is waiting for the API situation to resolve.

The admin dark mode was broken for a while, white text on a white background. These are the kinds of details that do not appear in tutorials.

## The result

The blog runs at zero monthly cost. The admin is at `/blog/admin/`, behind Firebase Auth. I write in a full-screen CodeMirror editor, hit Publish, and a newsletter goes out automatically.

The font is Geist. The design is minimal enough that the content is the only thing on the page.

The repository is at [github.com/martintomekvfx/blog](https://github.com/martintomekvfx/blog).
