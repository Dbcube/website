<div align="center">

# Dbcube — Documentation & Website

**The type-safe, Rust-powered ORM for PostgreSQL, MySQL, SQLite and MongoDB** —
works with Supabase, Turso and other managed hosts.

This repository is the source of **[dbcube.dev](https://dbcube.dev)**: the
marketing home, the full documentation, the performance/benchmarks pages, the
runnable examples and the blog.

</div>

---

## ✨ What's inside

- **Cinematic home** — a Three.js scrollytelling hero where a 3D cube descends
  into a circuit board, the databases connect, the benchmarks appear, and the
  core re-emerges as "Powered by Rust" — fully responsive (desktop & mobile).
- **Documentation** — getting started, guides (ORM, query builder, schemas),
  CLI, performance and architecture, written in Markdown with live Mermaid
  diagrams.
- **Examples** — a TypeScript feature tour plus real-world use cases (blog API,
  e-commerce checkout, auth, analytics dashboard, multi-database).
- **Benchmarks** — honest, reproducible numbers vs Prisma, Drizzle, TypeORM and
  Knex.
- **Blog** — launch posts and engineering notes, with a featured layout and
  per-post Open Graph images.
- **SEO out of the box** — titles, descriptions and static Open Graph images
  across the whole site.

## 🧱 Tech stack

| Layer | Tool |
|---|---|
| Framework | [Nuxt](https://nuxt.com) |
| Docs theme | [Docus](https://docus.dev) (Nuxt Content + Nuxt UI) |
| Content | [@nuxt/content](https://content.nuxt.com) (Markdown + MDC components) |
| 3D scene | [Three.js](https://threejs.org) |
| Diagrams | [Mermaid](https://mermaid.js.org) (rendered client-side) |
| Analytics | [Plausible](https://plausible.io) |

## 🚀 Local development

Requires **Node 18+** and **[Bun](https://bun.sh)** (the repo uses `bun.lock`).

```bash
bun install
bun run dev      # starts the dev server on http://localhost:3502
```

> The dev script pins port **3502** (`PORT=3502 nuxt dev --extends docus`).
> On Windows, run it through a POSIX shell (Git Bash) — `npm run dev` fails in
> `cmd` because of the inline `PORT=` variable.

Build for production:

```bash
bun run build
```

## 📁 Project structure

```
my-docs/
├── content/                     Markdown content (auto-routed)
│   ├── index.md                 home → renders the <home-landing> component
│   ├── 1.getting-started/ … 6.examples/   the documentation
│   └── blog/                    blog posts (collection: `blog`)
├── content.config.ts            content collections (docs, landing, blog)
├── app/
│   ├── components/
│   │   ├── AppHeader.vue         floating header
│   │   ├── BlackHoleCube.vue     the Three.js hero scene
│   │   ├── PlaygroundTerminal.vue  animated, syntax-highlighted terminal
│   │   └── content/HomeLanding.vue scrollytelling home (MDC component)
│   ├── pages/blog/              blog index + post viewer
│   └── plugins/mermaid.client.ts  renders mermaid code blocks to SVG
├── public/                      static assets (home.png, blog covers, logos, draco)
└── nuxt.config.ts               site config, SEO, color mode (dark-only)
```

## ✍️ Authoring content

- **Docs**: add a Markdown file under `content/` — the folder/number prefix sets
  the order and the URL. MDC components (`::callout`, etc.) and fenced mermaid
  diagrams are supported. Use a `ts` fence for `.cube` snippets (Shiki has no
  `cube` lexer).
- **Blog**: add `content/blog/<n>.<slug>.md` with frontmatter `title`,
  `description`, `date`, `cover`, `tags`, `featured`, `readingTime`. The newest
  post leads the index; `featured: true` pins it.

## 🌗 Notes

- The site is **dark-only** by design (color mode locked in `nuxt.config.ts`).
- Open Graph: the home and all docs use `public/home.png`; blog pages use each
  post's `cover`. Set `site.url` in `nuxt.config.ts` to your production domain.

## 🔗 Links

- Website: **https://dbcube.dev**
- npm: `npm install dbcube`
- Benchmarks: [`/performance/benchmarks`](https://dbcube.dev/performance/benchmarks)

---

<div align="center">
Made with care by the <strong>Dbcube</strong> team · MIT licensed
</div>
