# Blog

A minimalist tech & art blog built with Astro, MDX, and Tailwind CSS. Deployed automatically to GitHub Pages via GitHub Actions.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:4321/blog/](http://localhost:4321/blog/)

## Writing Posts

Create MDX files in `src/content/posts/`:

```mdx
---
title: "My Post Title"
description: "A short description."
pubDate: 2026-02-16
tags: ["tag1", "tag2"]
draft: false
---

# My Post

Content goes here. You can use standard markdown plus JSX components.
```

### Frontmatter fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Post title |
| `description` | string | yes | Short description for SEO and cards |
| `pubDate` | date | yes | Publication date |
| `updatedDate` | date | no | Last updated date |
| `heroImage` | string | no | Path to hero image (e.g. `/blog/images/hero.jpg`) |
| `tags` | string[] | no | List of tags |
| `draft` | boolean | no | If `true`, hidden in production |

### Using components in MDX

```mdx
import CodePlayground from '../../components/CodePlayground.jsx'

<CodePlayground client:load code={`console.log("hello");`} language="javascript" />
```

## CLI Tool

A Python CLI for managing posts from the terminal.

### Setup

```bash
cd cli
pip install -r requirements.txt
```

### Commands

```bash
python cli/blog.py new "My Post Title"           # Create a new post
python cli/blog.py new "Post" --tags "a,b"        # Create with tags
python cli/blog.py list                            # List all posts
python cli/blog.py list --drafts                   # List drafts only
python cli/blog.py list --tag "astro"              # Filter by tag
python cli/blog.py edit <slug>                     # Open in $EDITOR
python cli/blog.py publish <slug>                  # Set draft=false, commit & push
python cli/blog.py unpublish <slug>                # Set draft=true
python cli/blog.py delete <slug>                   # Delete (with confirmation)
python cli/blog.py push                            # Git add + commit + push posts
python cli/blog.py push -m "custom message"        # Custom commit message
python cli/blog.py status                          # Git status for posts
python cli/blog.py tags                            # List all tags with counts
```

## GitHub Pages Deploy

Deployment is automatic. Every push to `main` triggers `.github/workflows/deploy.yml` which builds and deploys to GitHub Pages.

### Setup

1. Go to your repo **Settings > Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` — the site will be live at `https://martintomekvfx.github.io/blog/`

## Pages CMS

This repo supports [Pages CMS](https://pagescms.org) for browser-based content editing.

1. Go to [pagescms.org](https://pagescms.org)
2. Sign in with GitHub
3. Select this repository
4. The `.pages.config.yml` configures the editor fields automatically

## Auto-Tweet on New Post

The `.github/workflows/tweet.yml` workflow posts to X/Twitter when a new post is added.

### Setup

1. Create a [X Developer](https://developer.twitter.com) account
2. Create a project & app with OAuth 1.0a (read + write)
3. Generate API Key, API Secret, Access Token, Access Secret
4. Add them as repository secrets in **Settings > Secrets and variables > Actions**:
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_SECRET`

## RSS Feed

Available at `/blog/rss.xml`. Use it with RSS readers or automation tools like IFTTT/Zapier.

## Project Structure

```
blog/
├── .github/workflows/     # CI/CD (deploy + tweet)
├── .pages.config.yml      # Pages CMS config
├── cli/                   # Python CLI tool
├── public/images/         # Static images
├── src/
│   ├── components/        # Astro & React components
│   ├── content/posts/     # MDX blog posts
│   ├── layouts/           # Page layouts
│   ├── pages/             # Routes
│   └── styles/            # Global CSS
├── astro.config.mjs
└── package.json
```

## Build

```bash
npm run build    # Output in dist/
npm run preview  # Preview the build locally
```
