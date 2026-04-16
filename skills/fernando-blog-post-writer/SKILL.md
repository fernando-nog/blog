---
name: fernando-blog-post-writer
description: Write or revise technical Markdown posts to match this repository's established style in content/blog. Use when creating new blog posts, adapting AI drafts to repository conventions, or performing style QA for consistency in structure, tone, frontmatter, and section flow.
---

# Fernando Blog Post Writer

## Execute
1. Identify post intent:
- `tutorial`: explain setup and implementation with commands.
- `comparison`: evaluate options with criteria and decision guidance.
- `troubleshooting`: diagnose symptom, apply fix, verify, prevent recurrence.
- `concept`: explain what, why, how, and practical use cases.
2. Load repository style baseline from `references/style-baseline.md`.
3. Select section blueprint from `references/post-blueprints.md` based on intent.
4. Create a draft with repository frontmatter and structure:
- Required frontmatter: `title`, `date`, `description`
- Recommended frontmatter: `tags`
- Use H2 sections as primary structure.
- Do not add H1 in body for normal posts.
5. Use concrete content patterns seen in this repository:
- Start with a practical hook paragraph (often `Picture this:`).
- Include actionable commands/snippets and tables when useful.
- End with a conclusion section and references section.
6. Run style QA:
- `scripts/style_check.sh <path/to/post.md>`
- Resolve failures before finalizing.

## Quick Start
Generate a repository-aligned scaffold:

```bash
skills/fernando-blog-post-writer/scripts/new_post_scaffold.sh \
  --slug my-topic-slug \
  --title "My Topic Title" \
  --description "Short SEO-ready summary of the article" \
  --tags topic-a,topic-b \
  --type tutorial
```

Validate a draft:

```bash
skills/fernando-blog-post-writer/scripts/style_check.sh content/blog/my-topic-slug.md
```

## Output Contract
Produce final Markdown ready for `content/blog/<slug>.md` with:
1. Valid frontmatter (`title`, `date`, `description`; include `tags` unless intentionally omitted).
2. Hook paragraph opening.
3. H2-led structure matching the selected blueprint.
4. Conclusion section and references section.
5. Correct Markdown formatting and runnable command/code snippets where applicable.

## Guardrails
- Keep tone practical and technical; avoid generic filler.
- Prefer explicit titles and kebab-case slugs.
- Use current, verifiable claims for dates, versions, and benchmarks.
- If claims are uncertain, mark assumptions and avoid fabricated numbers.
