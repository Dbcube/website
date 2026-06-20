import { defineContentConfig, defineCollection, z } from '@nuxt/content'

// We override Docus's content config to add a dedicated `blog` collection.
// The `landing` and `docs` collections must be re-declared so Docus keeps
// working; `docs` now excludes `blog/**` so posts don't render with the
// documentation layout — the blog has its own pages under app/pages/blog.
export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: { include: 'index.md' },
    }),
    docs: defineCollection({
      type: 'page',
      source: { include: '**', exclude: ['index.md', 'blog/**'] },
      schema: z.object({
        links: z.array(z.object({
          label: z.string(),
          icon: z.string(),
          to: z.string(),
          target: z.string().optional(),
        })).optional(),
      }),
    }),
    blog: defineCollection({
      type: 'page',
      source: { include: 'blog/**', prefix: '/blog' },
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),            // ISO date, e.g. "2026-06-19"
        author: z.string().optional(),
        role: z.string().optional(),
        cover: z.string().optional(), // path under /public
        tags: z.array(z.string()).optional(),
        featured: z.boolean().optional(),
        readingTime: z.string().optional(),
      }),
    }),
  },
})
