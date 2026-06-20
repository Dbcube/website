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
