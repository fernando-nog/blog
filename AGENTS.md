# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/`: route-based pages (`index.js`, `blog.js`, `404.js`).
- `src/components/`: reusable UI pieces (layout, SEO, bio, landing page).
- `src/templates/blog-post.js`: Markdown post template used by `gatsby-node.js`.
- `content/blog/`: blog posts in Markdown, one file per post (kebab-case filenames).
- `static/`: static assets copied as-is (favicon, robots, IndexNow key file).
- Root config: `gatsby-config.js`, `gatsby-node.js`, `netlify.toml`, `.nvmrc`.

## Build, Test, and Development Commands
- `npm install`: install dependencies (Node `22.17.0`, npm `11.4.2+`).
- `npm run develop` (or `npm start`): run local dev server with hot reload.
- `npm run build`: create production build in `public/`.
- `npm run serve`: serve the production build locally.
- `npm run clean`: clear Gatsby cache when content/schema changes behave oddly.
- `npm run format`: format JS/TS/JSON/MD files with Prettier.

## Coding Style & Naming Conventions
- Formatting is enforced via Prettier (`.prettierrc`: no semicolons, `arrowParens: avoid`).
- Use 2-space indentation and keep existing Gatsby starter style in JS files.
- Component/page filenames use lowercase or kebab-case (`blog-post.js`, `landing-page.js`).
- Blog post files should be kebab-case and include frontmatter:
  - `title`, `date` (`YYYY-MM-DD`), `description`.

## Testing Guidelines
- There is no automated unit/integration suite yet; `npm test` is a placeholder and fails intentionally.
- Required validation before PR:
  1. `npm run build` passes.
  2. `npm run serve` renders key pages and recent posts correctly.
  3. New Markdown post slug/frontmatter resolves to the expected URL.

## Commit & Pull Request Guidelines
- Follow existing commit style from history: imperative, descriptive subjects.
- Common patterns:
  - `Add new blog post: "<Post Title>"`
  - `Update <post-file>.md`
  - `security: fix <issue>`
- Keep PRs focused (single post or single technical change).
- PR description should include:
  1. What changed and why.
  2. Validation steps run (`npm run build`, local smoke checks).
  3. Screenshots only when UI/layout changed.

## Deployment & Publishing Notes
- Netlify builds with `npm run build` and publishes `public/`.
- After publishing new content, use `submit-new-post.sh` or `submit-to-indexnow.sh` to notify IndexNow-compatible engines.
