# Fernando Nogueira's Personal Blog

This is the source code for my personal technical blog built with Gatsby. The blog covers software engineering topics, tutorials, and insights.

🌐 **Live site**: [https://fernando-nog.netlify.app/](https://fernando-nog.netlify.app/)

Built with Gatsby's blog starter template and customized for my personal needs.

## SEO & Performance

The site is built as a static Gatsby site and includes the following:

- Sitemap and `robots.txt` generation
- Canonical URLs per page
- JSON-LD structured data (`Person`, `WebSite`, `BlogPosting`)
- Open Graph and Twitter Cards
- RSS feed at `/rss.xml`
- Google Analytics 4
- Bing Webmaster Tools verification (`BingSiteAuth.xml` and `msvalidate.01` meta tag)
- IndexNow key at `/7da7e958279d4584b39e1a298108ea4e.txt` for fast indexing on Bing, Yandex, Naver, Seznam, Yep, and other participating engines

## Search Engine Indexing

The site is optimized for discovery across multiple search engines:

- **Google**: Sitemap at `/sitemap-index.xml`, canonical URLs, structured data
- **Bing / Yahoo / DuckDuckGo / Ecosia**: IndexNow integration notifies participating engines of new and updated pages immediately after deploy
- **Yandex, Naver, Seznam, Yep**: Also supported via IndexNow
- **AI search engines (ChatGPT, Perplexity, Gemini, Copilot, etc.)**: They rely on the same signals — quality content, structured data, fresh sitemap, and external mentions/links

A local helper script at `scripts/submit-indexnow.sh` submits URLs to IndexNow endpoints. It is intentionally kept out of git (see `.gitignore`) because it references a project-specific key.

## Available Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run develop` | Start local development server      |
| `npm run build`   | Create a production build           |
| `npm run serve`   | Serve the production build locally  |
| `npm run clean`   | Clear Gatsby cache and build output |
| `npm run format`  | Run Prettier on JS/TS/JSON/MD files |

## Deployment

The site is automatically deployed to Netlify on every push to the default branch.
