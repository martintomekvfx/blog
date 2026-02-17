# Martin Tomek Blog

A brutalist, editorial blog for art / VFX / research notes built with Astro + React.

- Public site: GitHub Pages
- Publishing UI: `/blog/admin/`
- Post source of truth: Firestore

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:4321/blog/](http://localhost:4321/blog/)

## Publishing Posts (Admin + MDX)

1. Open `/blog/admin/`
2. Create or edit a post
3. Write content in MDX
4. Publish by turning off `draft`

Supported embed components inside post content:

```mdx
<CodePlayground code={`console.log("hello");`} language="javascript" />

<SquarePulse title="Signal" caption="A visual marker in public space." />
```

The editor also includes an **Insert square post template** shortcut to start a new article draft quickly.

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

### Optional build variables

Set repository variable `PUBLIC_BUTTONDOWN_USERNAME` (Settings → Secrets and variables → Actions → Variables)
to enable the live newsletter subscribe form in production builds.

## Newsletter Setup (Buttondown)

1. Create a Buttondown account
2. Choose your username (e.g. `martintomek`)
3. Add variable `PUBLIC_BUTTONDOWN_USERNAME` in GitHub repo variables
4. Push to `main` to redeploy
5. Newsletter page is available at `/blog/newsletter/`

The RSS feed remains available at `/blog/rss.xml` for automation.

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
│   ├── lib/               # Firebase client config
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
