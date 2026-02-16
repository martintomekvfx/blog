#!/usr/bin/env python3
"""Blog CLI — manage MDX posts from the command line."""

import os
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

import click
import frontmatter

POSTS_DIR = Path(__file__).resolve().parent.parent / "src" / "content" / "posts"


def slugify(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def get_all_posts():
    """Return all MDX/MD posts with parsed frontmatter."""
    posts = []
    if not POSTS_DIR.exists():
        return posts
    for f in sorted(POSTS_DIR.iterdir()):
        if f.suffix in (".mdx", ".md"):
            post = frontmatter.load(str(f))
            posts.append((f, post))
    return posts


def find_post(slug: str) -> tuple[Path, frontmatter.Post] | None:
    """Find a post by slug (filename without extension)."""
    for ext in (".mdx", ".md"):
        path = POSTS_DIR / f"{slug}{ext}"
        if path.exists():
            return path, frontmatter.load(str(path))
    return None


def git(*args: str) -> str:
    """Run a git command in the repo root."""
    repo_root = Path(__file__).resolve().parent.parent
    result = subprocess.run(
        ["git", *args],
        cwd=repo_root,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 and result.stderr:
        click.echo(f"git error: {result.stderr.strip()}", err=True)
    return result.stdout.strip()


@click.group()
def cli():
    """Blog CLI — manage your MDX blog posts."""
    pass


@cli.command()
@click.argument("title")
@click.option("--tags", "-t", default="", help="Comma-separated tags")
@click.option("--no-edit", is_flag=True, help="Don't open in editor")
def new(title: str, tags: str, no_edit: bool):
    """Create a new blog post."""
    slug = slugify(title)
    filepath = POSTS_DIR / f"{slug}.mdx"

    if filepath.exists():
        click.echo(f"Error: Post already exists at {filepath}", err=True)
        sys.exit(1)

    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    post = frontmatter.Post(
        content=f"\n# {title}\n\nWrite your post here.\n",
        title=title,
        description="",
        pubDate=date.today().isoformat(),
        tags=tag_list,
        draft=True,
    )

    filepath.write_text(frontmatter.dumps(post), encoding="utf-8")
    click.echo(f"Created: {filepath}")

    if not no_edit:
        editor = os.environ.get("EDITOR", "vim")
        subprocess.run([editor, str(filepath)])


@cli.command("list")
@click.option("--drafts", is_flag=True, help="Show only drafts")
@click.option("--tag", default=None, help="Filter by tag")
def list_posts(drafts: bool, tag: str):
    """List all blog posts."""
    posts = get_all_posts()

    if drafts:
        posts = [(f, p) for f, p in posts if p.get("draft", False)]

    if tag:
        posts = [(f, p) for f, p in posts if tag in p.get("tags", [])]

    if not posts:
        click.echo("No posts found.")
        return

    for filepath, post in posts:
        draft_marker = " [DRAFT]" if post.get("draft", False) else ""
        tags_str = ", ".join(post.get("tags", []))
        pub = post.get("pubDate", "?")
        click.echo(f"  {pub}  {post['title']}{draft_marker}")
        if tags_str:
            click.echo(f"          tags: {tags_str}")
        click.echo(f"          slug: {filepath.stem}")


@cli.command()
@click.argument("slug")
def edit(slug: str):
    """Open a post in your editor."""
    result = find_post(slug)
    if not result:
        click.echo(f"Error: Post '{slug}' not found.", err=True)
        sys.exit(1)
    filepath, _ = result
    editor = os.environ.get("EDITOR", "vim")
    subprocess.run([editor, str(filepath)])


@cli.command()
@click.argument("slug")
def publish(slug: str):
    """Set draft to false, commit, and push."""
    result = find_post(slug)
    if not result:
        click.echo(f"Error: Post '{slug}' not found.", err=True)
        sys.exit(1)

    filepath, post = result
    post["draft"] = False
    filepath.write_text(frontmatter.dumps(post), encoding="utf-8")
    click.echo(f"Published: {post['title']}")

    git("add", str(filepath))
    git("commit", "-m", f"blog: publish {slug}")
    git("push", "origin", "main")
    click.echo("Pushed to origin/main. GitHub Actions will deploy automatically.")


@cli.command()
@click.argument("slug")
def unpublish(slug: str):
    """Set draft to true."""
    result = find_post(slug)
    if not result:
        click.echo(f"Error: Post '{slug}' not found.", err=True)
        sys.exit(1)

    filepath, post = result
    post["draft"] = True
    filepath.write_text(frontmatter.dumps(post), encoding="utf-8")
    click.echo(f"Unpublished: {post['title']}")


@cli.command()
@click.argument("slug")
@click.confirmation_option(prompt="Are you sure you want to delete this post?")
def delete(slug: str):
    """Delete a post (with confirmation)."""
    result = find_post(slug)
    if not result:
        click.echo(f"Error: Post '{slug}' not found.", err=True)
        sys.exit(1)

    filepath, post = result
    filepath.unlink()
    click.echo(f"Deleted: {post['title']} ({filepath.name})")


@cli.command()
@click.option("--message", "-m", default="blog: update posts", help="Commit message")
def push(message: str):
    """Stage, commit, and push all post changes."""
    git("add", str(POSTS_DIR))
    status = git("status", "--porcelain", "--", str(POSTS_DIR))

    if not status:
        click.echo("No changes to push.")
        return

    git("commit", "-m", message)
    git("push", "origin", "main")
    click.echo("Pushed. GitHub Actions will deploy automatically.")


@cli.command()
def status():
    """Show git status for the posts directory."""
    output = git("status", "--short", "--", str(POSTS_DIR))
    if output:
        click.echo(output)
    else:
        click.echo("No changes in posts directory.")


@cli.command()
def tags():
    """List all tags with post counts."""
    posts = get_all_posts()
    tag_counts: dict[str, int] = {}
    for _, post in posts:
        for tag in post.get("tags", []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    if not tag_counts:
        click.echo("No tags found.")
        return

    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
        click.echo(f"  {tag} ({count})")


if __name__ == "__main__":
    cli()
