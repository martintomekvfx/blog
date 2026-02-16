---
title: "Markdown Features Demo"
description: "A showcase of markdown capabilities -- code blocks, tables, and more."
pubDate: "2026-02-16"
tags: ["mdx","web","tutorial"]
draft: true
---

# Markdown features

This post demonstrates the key features available for writing posts on this blog.

## Syntax-highlighted code blocks

Standard fenced code blocks get automatic syntax highlighting via Shiki:

```typescript
interface Post {
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  draft: boolean;
}

function getPublishedPosts(posts: Post[]): Post[] {
  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
}
```

## More code examples

```javascript
// Array manipulation
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled.join(", "));

const sum = numbers.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);
```

## Text formatting

You can use **bold**, *italic*, ~~strikethrough~~, and `inline code`.

## Lists

1. First item
2. Second item
3. Third item

- Unordered item
- Another item

## Blockquotes

> The best way to predict the future is to invent it.
> -- Alan Kay

## Tables

| Feature | Supported |
|---------|-----------|
| MDX components | Yes |
| Syntax highlighting | Yes |
| Frontmatter | Yes |
| Tags | Yes |
| Draft mode | Yes |

## Images

Place images in the `public/images/` directory and reference them:

```markdown
![Alt text](/blog/images/my-image.png)
```

That's it -- everything you need to write rich blog posts.
