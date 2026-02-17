# Post Writing Guide for Martin Tomek's Blog

## Who is writing

Martin Tomek — artist, VFX compositor, researcher, teacher. Based in Prague.
Working at FAMU / CAS (2025–2027). Research and interventions around Palmovka, Prague 8.

Practice spans:
- Guerilla art / tactical urbanism (public-space interventions, temporary installations)
- VFX compositing and moving image (film, 16mm, scanner experiments, VJ sets)
- Creative coding and open tools (interactive work, game jams, open-source)
- Teaching and workshop design
- Research on attention ecology

## Voice and tone

- First person, direct, no fluff
- Mix of Czech and English is fine — Czech for personal/reflective passages, English for technical or public-facing content
- Brutalist clarity: short sentences, concrete observations
- No marketing language, no "exciting journey" clichés
- Process-forward: show the thinking, not just the result
- Allowed to be incomplete — field notes are not essays

## Post structure

Every post should have:

```
---
title: Short, specific title (not clickbait)
description: One sentence. What is this actually about.
pubDate: YYYY-MM-DD
tags: [comma, separated, lowercase]
draft: true
---

Body content in MDX.
```

## Tags to use (pick 1–4)

- `process` — behind-the-scenes, how something was made
- `urbanism` — city, public space, interventions
- `vfx` — compositing, film, moving image
- `code` — tools, scripts, creative coding
- `teaching` — workshops, pedagogy, education
- `research` — academic, theory, observation
- `game` — game jams, interactive work
- `analog` — film, scanner, material-based work
- `installation` — physical installations, spatial work
- `palmovka` — specifically about Palmovka / Prague 8 work

## Embeddable MDX components

Use these inline in post content:

```mdx
<CodePlayground code={`console.log("hello");`} language="javascript" />

<SquarePulse title="Signal name" caption="What this square represents." />
<SquarePulse title="Palmovka marker" caption="A visual anchor for the intervention." size={160} />
```

`SquarePulse` is an animated square — use it to mark visual interventions, attention points, or as a section break with meaning.

## Writing patterns that work well

### Process log
```
Short intro — what was the situation.

What I tried. What failed. What worked.

One concrete observation or takeaway.

Optional: embed a component or image.
```

### Field note
```
Date or location as context.

What I noticed / what happened.

Why it matters (briefly).

What comes next.
```

### Tool / code post
```
What problem this solves.

How to use it (code block or CodePlayground embed).

Limitations or open questions.
```

## Length

- Field notes: 150–400 words
- Process logs: 300–700 words
- Research / teaching posts: 500–1200 words
- No minimum — a 80-word note is fine if it's precise

## What to avoid

- Do not summarize what the post is about at the end ("In conclusion...")
- Do not use em-dashes excessively
- Do not pad with context the reader doesn't need
- Do not explain what MDX or Astro is — readers know
- Do not write "I am excited to share..."

## Example opening lines (good)

- "The square is 80×80 cm. I placed it at the corner of Palmovka and left."
- "Three hours into the VJ set, the projector died. Here's what I learned."
- "This tool does one thing: it converts scanner output to usable EXR sequences."
- "Workshopy na FAMU tento semestr šly jinak, než jsem čekal."

## Example opening lines (bad)

- "In this post, I will explore the fascinating world of..."
- "Today I want to talk about something that has been on my mind..."
- "As a creative practitioner, I often find myself..."
