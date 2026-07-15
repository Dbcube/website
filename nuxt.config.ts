// nuxt-site-config resolves the canonical URL from NUXT_PUBLIC_SITE_URL with the
// highest priority. On edge/dynamic hosting `site.url` in config alone wasn't
// being honored (the sitemap emitted RELATIVE <loc> URLs, which Google rejects),
// so we pin the env var here — it's read at build time, when the sitemap is
// prerendered, guaranteeing absolute URLs. A real env var (e.g. in Cloudflare)
// still wins over this default.
if (!process.env.NUXT_PUBLIC_SITE_URL) {
  process.env.NUXT_PUBLIC_SITE_URL = 'https://dbcube.dev'
}

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxtjs/plausible', '@nuxtjs/color-mode'],
  css: ['~/assets/css/main.css'],
  // Global SEO default: the home screenshot is the preview image everywhere
  // (home + all docs). Pages can override it — blog posts set their own cover.
  app: {
    head: {
      meta: [
        { property: 'og:image', content: 'https://dbcube.dev/home.png' },
        { property: 'og:image:width', content: '1904' },
        { property: 'og:image:height', content: '882' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:image', content: 'https://dbcube.dev/home.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    },
  },
  // Tema BLOQUEADO en oscuro: el sitio es solo dark, no se puede cambiar.
  // preference fijo a 'dark' e ignoramos la preferencia del sistema.
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
    dataValue: 'dark',
  },
  content: {
    database: undefined,
  },
  // SEO foundation: canonical URLs, og:url, sitemap, etc. build off site.url.
  site: {
    url: 'https://dbcube.dev',
    name: 'Dbcube',
    description: 'The type-safe, Rust-powered ORM for PostgreSQL, MySQL, SQLite and MongoDB — and it works with Supabase, Turso and other managed hosts.',
  },
  // We use STATIC Open Graph images (home.png everywhere, the post cover on the
  // blog), not generated ones — so the dynamic og-image module is turned off.
  // With it disabled, docus's `defineOgImageComponent()` calls become safe no-ops.
  ogImage: {
    enabled: false,
  },
  // Prerender the SEO routes at build time. On dynamic (edge/Cloudflare) hosting
  // the sitemap module can't infer the host at runtime and emits RELATIVE <loc>
  // URLs — which Google rejects. Prerendering runs while `site.url` is known, so
  // the sitemap gets absolute URLs (https://dbcube.dev/...).
  nitro: {
    prerender: {
      routes: ['/sitemap.xml', '/robots.txt'],
    },
  },
  compatibilityDate: '2025-07-18',
  llms: {
    domain: 'https://dbcube.dev',
    title: 'Dbcube',
    description: 'The type-safe, Rust-powered ORM for PostgreSQL, MySQL, SQLite and MongoDB.',
    full: {
      title: 'Dbcube',
      description: 'The type-safe, Rust-powered ORM for PostgreSQL, MySQL, SQLite and MongoDB.',
    },
  },
})
