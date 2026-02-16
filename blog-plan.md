# Plán: Astro MDX Blog s CMS, CLI a auto-deploy

## Přehled projektu

Vytvoř kompletní blog systém postavený na Astro s MDX podporou, hostovaný na GitHub Pages. Blog musí umožňovat správu obsahu bez nutnosti ručního rebuildu — přidání nového článku = push markdown/MDX souboru, GitHub Actions automaticky buildnou a deployjí.

## Tech Stack

- **Framework:** Astro (nejnovější stabilní verze) s `@astrojs/mdx` integrací
- **Hosting:** GitHub Pages (deploy přes GitHub Actions)
- **CMS:** Pages CMS (pagescms.org) — konfigurace přes `.pages.config.yml`
- **CLI:** Python CLI tool pro správu postů z příkazového řádku
- **Social:** GitHub Action pro automatický post na X/Twitter při publikaci nového článku
- **Styling:** Tailwind CSS
- **Syntax highlighting:** Shiki (built-in v Astro)

## Struktura repozitáře

```
blog/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # Build & deploy na GH Pages
│       └── tweet.yml               # Auto-post na X při novém článku
├── .pages.config.yml               # Pages CMS konfigurace
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   └── images/                     # Statické obrázky
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro        # Hlavní layout (head, nav, footer)
│   │   └── PostLayout.astro        # Layout pro jednotlivé posty
│   ├── pages/
│   │   ├── index.astro             # Homepage — seznam článků
│   │   ├── about.astro             # O mně stránka
│   │   ├── tags/
│   │   │   ├── index.astro         # Přehled všech tagů
│   │   │   └── [tag].astro         # Články filtrované podle tagu
│   │   └── posts/
│   │       └── [...slug].astro     # Dynamická stránka pro každý post
│   ├── content/
│   │   ├── config.ts               # Astro content collection schema (Zod)
│   │   └── posts/                  # Složka s MDX články
│   │       └── example-post.mdx    # Ukázkový článek
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── PostCard.astro          # Karta článku na homepage
│   │   ├── TagList.astro           # Seznam tagů
│   │   ├── CodePlayground.jsx      # Interaktivní code snippet (React, client:load)
│   │   └── TableOfContents.astro   # Automatický obsah článku
│   └── styles/
│       └── global.css              # Globální styly + Tailwind directives
└── cli/
    ├── blog.py                     # Hlavní CLI skript
    ├── requirements.txt            # Python závislosti (click, python-frontmatter, GitPython)
    └── README.md                   # Dokumentace CLI
```

## Fáze 1: Astro projekt

### 1.1 Inicializace
- Vytvoř nový Astro projekt: `npm create astro@latest blog`
- Přidej integrace: `@astrojs/mdx`, `@astrojs/tailwind`, `@astrojs/react` (pro interaktivní MDX komponenty)
- Nastav `astro.config.mjs`:
  - `site`: placeholder URL (uživatel si změní na svoji doménu/GH Pages URL)
  - `output: 'static'`
  - Integrace: mdx(), tailwind(), react()

### 1.2 Content Collection
- Definuj schema v `src/content/config.ts` pomocí Zod:
  ```typescript
  const postsCollection = defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.date(),
      updatedDate: z.date().optional(),
      heroImage: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    })
  });
  ```
- Draft posty (`draft: true`) se NEzobrazují v produkci, ale zobrazují se v dev režimu

### 1.3 Layouts
- **BaseLayout.astro**: HTML head (SEO meta, Open Graph tags), navigace, footer, slot pro obsah
- **PostLayout.astro**: Rozšiřuje BaseLayout, přidává nadpis článku, datum, tagy, hero image, table of contents, obsah článku

### 1.4 Stránky
- **index.astro**: Načte všechny posty z content collection, seřadí podle data (nejnovější první), filtruje drafty v produkci, zobrazí jako karty
- **posts/[...slug].astro**: Dynamická stránka — `getStaticPaths()` generuje stránky pro všechny posty
- **tags/index.astro**: Zobrazí všechny použité tagy s počtem článků
- **tags/[tag].astro**: Filtruje posty podle tagu

### 1.5 Komponenty
- **PostCard.astro**: Karta s náhledem, titulkem, datem, popisem, tagy
- **CodePlayground.jsx**: React komponenta s `client:load` — editovatelný code block s live preview. Použij jednoduchý textarea + iframe/eval přístup
- **TableOfContents.astro**: Automaticky generovaný z headings článku

### 1.6 Styling
- Minimalistický, čistý design orientovaný na čtení
- Dark/light mode toggle (CSS variables + prefers-color-scheme)
- Dobré typografické nastavení pro dlouhé texty (prose třídy z `@tailwindcss/typography`)
- Responzivní layout

### 1.7 Ukázkový MDX článek
Vytvoř `src/content/posts/hello-world.mdx`:
```mdx
---
title: "Hello World: Můj první post"
description: "Úvodní článek o tomto blogu a technologiích za ním."
pubDate: 2026-02-16
tags: ["meta", "astro", "web"]
---

import CodePlayground from '../../components/CodePlayground.jsx'

# Vítejte na mém blogu

Tady bude obsah článku...

## Interaktivní demo

<CodePlayground client:load code={`console.log("Hello from MDX!");`} language="javascript" />
```

## Fáze 2: GitHub Actions — Auto Deploy

### 2.1 Deploy workflow (`.github/workflows/deploy.yml`)
- Trigger: push na `main` branch
- Steps:
  1. Checkout repo
  2. Setup Node.js (v20+)
  3. Install dependencies (`npm ci`)
  4. Build Astro (`npm run build`)
  5. Deploy do GitHub Pages (použij `actions/deploy-pages@v4`)
- Nastav Astro pro GH Pages v `astro.config.mjs`: `base` path pokud je to `username.github.io/repo-name`

### 2.2 Tweet workflow (`.github/workflows/tweet.yml`)
- Trigger: push na `main` branch, ale jen pokud se změnily soubory v `src/content/posts/`
- Steps:
  1. Checkout repo
  2. Detekuj nové/změněné MDX soubory (git diff)
  3. Parsuj frontmatter nového postu (title, description, tags)
  4. Sestav tweet: "{title} — {description} {url} {hashtags}"
  5. Pošli přes X API v2 (curl nebo Python script)
- Potřebné secrets: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`
- Přidej do workflow jasný komentář, jak si uživatel nastaví X API credentials

## Fáze 3: Pages CMS konfigurace

### 3.1 Vytvoř `.pages.config.yml` v rootu repa:
```yaml
media:
  input: public/images
  output: /images

content:
  - name: posts
    label: "Blog Posts"
    type: collection
    path: src/content/posts
    format: mdx
    fields:
      - name: title
        label: Title
        type: string
        required: true
      - name: description
        label: Description
        type: text
        required: true
      - name: pubDate
        label: Publication Date
        type: date
        required: true
      - name: updatedDate
        label: Last Updated
        type: date
      - name: heroImage
        label: Hero Image
        type: image
      - name: tags
        label: Tags
        type: string
        list: true
      - name: draft
        label: Draft
        type: boolean
      - name: body
        label: Content
        type: rich-text
```

## Fáze 4: Python CLI Tool

### 4.1 Závislosti (`cli/requirements.txt`)
```
click
python-frontmatter
GitPython
```

### 4.2 CLI příkazy (`cli/blog.py`)
Implementuj pomocí Click frameworku:

```
blog new "Název článku"           # Vytvoří nový MDX soubor s frontmatter, otevře v $EDITOR
blog list                          # Vypíše všechny články (title, date, draft status, tags)
blog list --drafts                 # Jen drafty
blog list --tag "ar"               # Filtruj podle tagu
blog edit <slug>                   # Otevře existující článek v $EDITOR
blog publish <slug>                # Změní draft: true → false a commitne + pushne
blog unpublish <slug>              # Změní draft: false → true
blog delete <slug>                 # Smaže článek (s potvrzením)
blog push                          # Git add + commit + push všech změn v posts/
blog status                        # Git status pro posts složku
blog tags                          # Vypíše všechny použité tagy s počtem
```

### 4.3 Chování `blog new`:
1. Vygeneruje slug z názvu (ASCII, lowercase, pomlčky)
2. Vytvoří soubor `src/content/posts/{slug}.mdx`
3. Naplní frontmatter:
   ```yaml
   ---
   title: "Název článku"
   description: ""
   pubDate: 2026-02-16  # aktuální datum
   tags: []
   draft: true
   ---
   ```
4. Otevře soubor v `$EDITOR` (nebo `--no-edit` flag)
5. Volitelně: `--tags "ar,street-art"` pro předvyplnění tagů

### 4.4 Chování `blog push`:
1. `git add src/content/posts/`
2. `git commit -m "blog: update posts"`  (nebo custom message přes `--message`)
3. `git push origin main`
4. Vypíše info, že GH Actions se spustí automaticky

### 4.5 Instalace CLI
- Přidej do `cli/` jednoduchý `setup.py` nebo instrukce pro `pip install -e .`
- Nebo prostý alias: `alias blog="python /path/to/cli/blog.py"`

## Fáze 5: RSS Feed

- Přidej `@astrojs/rss` integraci
- Vytvoř `src/pages/rss.xml.ts` — generuje RSS feed ze všech publikovaných postů
- RSS je důležitý pro případnou automatizaci přes IFTTT/Zapier jako alternativu k přímému X API

## Požadavky na kvalitu

1. **Vše musí fungovat out of the box** po `npm install` — žádné ruční kroky navíc
2. **README.md** v rootu s kompletní dokumentací:
   - Jak nastavit a spustit lokálně
   - Jak nastavit GitHub Pages deploy
   - Jak připojit Pages CMS
   - Jak nastavit X/Twitter API klíče
   - Jak používat CLI tool
   - Jak psát MDX posty s komponentami
3. **Ukázkové posty** — minimálně 2 example posty demonstrující MDX features (importy komponent, code blocks, obrázky)
4. **Typecheck** — `npm run build` musí projít bez chyb
5. **Responzivní design** — mobile-first, funguje na všech zařízeních

## Pořadí implementace

1. Nejdřív Astro projekt s MDX, layouts, pages, styling
2. Pak content collection + ukázkové posty
3. Pak interaktivní komponenty (CodePlayground)
4. Pak GitHub Actions (deploy + tweet)
5. Pak Pages CMS config
6. Pak Python CLI tool
7. Na konec RSS feed + README dokumentace

## Poznámky

- Repo bude pod GitHub účtem `Themolx`
- Design by měl být tmavý/minimalistický, vhodný pro tech/art blog
- Jazyk UI blogu: angličtina (obsah článků bude česky i anglicky)
- Nepoužívej žádné placené služby — vše musí být zdarma nebo open-source
