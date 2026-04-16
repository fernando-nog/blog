# Blog Style Baseline (Repository-Specific)

## Corpus Snapshot
- Scope: `content/blog/*.md` (24 posts)
- Average length: ~1,945 words
- Typical section density: ~10 H2 sections per post
- Posts with tags: 22/24
- Posts with references section: 22/24
- Posts with conclusion-like ending: 21/24
- Posts with code fences: 22/24

## Required Structure
1. Frontmatter at top:
- `title` (quoted string)
- `date` (`YYYY-MM-DD`)
- `description` (quoted string)
- `tags` (recommended in this repository; list of lowercase hyphenated terms)
2. Do not add an H1 in body for normal posts; title comes from frontmatter.
3. Start with a hook paragraph (usually scenario-driven, often opening with `Picture this:`).
4. Use H2-driven sections (`##`) as the primary structure.
5. Close with:
- a conclusion section (`## Conclusion`, `## Final Thoughts`, or `## The Bottom Line`)
- a references section (`## References` or equivalent)

## Voice and Tone
- Write in second person and practical coaching style.
- Explain tradeoffs, not only definitions.
- Prefer concrete guidance: commands, snippets, examples, and small decision tables.
- Keep language direct and friendly, but technical.

## Common Content Blocks
- Problem framing and why it matters
- Conceptual explanation
- Step-by-step setup or implementation
- Pitfalls and troubleshooting
- Best practices and recommendations
- Final recommendation / conclusion
- External references

## Formatting Patterns
- Use fenced code blocks with language identifiers when possible.
- Use Markdown tables for comparisons and compatibility matrices.
- Use internal links to related posts when relevant.
- Keep section titles benefit-oriented (e.g., `## Why X Matters`, `## Practical Configuration Examples`).

## Title and Slug Patterns
- Titles are explicit and SEO-oriented (often include tools, year, and intent).
- Filenames are kebab-case slugs that mirror post topic and keywords.
- Favor explicit titles over clever or vague phrasing.
