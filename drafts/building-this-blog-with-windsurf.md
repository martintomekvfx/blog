---
title: Building This Blog With Windsurf
description: How I built a full-stack blog with admin panel, newsletter, and auto-deploy in two evenings using an AI IDE
pubDate: 2026-02-17
tags: [process, code, tools, behind-the-scenes]
draft: false
---

I wanted a proper writing space. Not a static CMS I'd fight with, not another Medium account. A real system — mine — with a database, a browser-based editor, automatic deployment, and a newsletter that sends itself.

I built it in two evenings using Windsurf.

## What I wanted

A blog that:

- Looks clean and minimal — I was looking at [benji.org](https://benji.org) and [emilkowal.ski](https://emilkowal.ski)
- Has a real admin panel I can write in from any browser
- Stores posts in a database, not files committed to git
- Deploys automatically to GitHub Pages on push
- Sends a newsletter when I publish a new post
- Costs nothing to run

## The stack

- **Astro** — static site generator, fast builds, good component model
- **React** — interactive components: post list, post viewer, admin panel
- **Firebase Firestore** — the database; free tier handles everything at this scale
- **Firebase Auth** — single-user authentication for the admin
- **CodeMirror** — markdown editor embedded in the admin panel
- **MDX** — posts can contain embedded React components like `<SquarePulse />` and `<CodePlayground />`
- **Tailwind CSS** — utility styling, no custom CSS except font declarations
- **Geist** — font from Vercel, the Sans and Mono weights; Pixel variant available for glitch effects
- **GitHub Pages** — free hosting, deploys on push to `main`
- **GitHub Actions** — CI/CD pipeline; also handles newsletter dispatch via the Buttondown API
- **Buttondown** — newsletter service, $0 for under 100 subscribers

The repository is at [github.com/martintomekvfx/blog](https://github.com/martintomekvfx/blog).

## How Windsurf works

Windsurf is an IDE with an embedded AI agent called Cascade. It reads your files, runs terminal commands, edits code directly, and executes git operations. You describe what you want in plain language. It builds it.

The difference from pasting into ChatGPT: it doesn't show you code to copy. It writes the code into the files. It can read errors, fix them, and push the result.

I would say something like: *"Add a settings panel to the admin where I can store the GitHub dispatch token."* Cascade would read `Admin.jsx`, write the component, apply the edit, and confirm. If the build failed, it would read the error and fix it.

For this project I described roughly what I wanted, iterated on the design by referencing real sites, and fixed bugs by pasting error messages directly into the chat.

## What worked well

The admin panel came together quickly. Firebase Auth for login, Firestore for storage, CodeMirror for editing. The GitHub Actions workflow for newsletter dispatch works like this: the admin triggers it via the GitHub API when a post is published, the workflow fetches the latest post from Firestore, formats an email, and sends it via Buttondown. One click publish → newsletter out.

Design iteration was fast. I said *"redesign the homepage to match benji.org"* and the components were rewritten in a few minutes. Then *"use Geist font"*, and the npm package was installed, font files copied to public, and CSS updated.

Debugging went faster than usual. A React hooks ordering bug (error #310) that would have taken me an hour to track down was diagnosed and fixed in one exchange.

## What didn't work

Twitter's API is now credit-based. Even on a brand new developer account, the first API call returned `CreditsDepleted`. The auto-tweet feature is technically built and wired — it's just waiting for the API situation to resolve. The newsletter still works fine.

Some things required more back and forth than expected. The admin dark mode was broken (white text on white background). Firestore REST API queries needed the API key as a query param, not a header. These are the kind of details that don't make it into tutorials.

## The result

The blog runs on €0/month. The admin panel is at `/blog/admin/`, behind Firebase Auth. I write in a full-screen CodeMirror editor, hit Publish, and a newsletter goes out automatically.

The font is Geist. The design is minimal enough that content is the only thing on the page.

I think that's what the tool should do.
