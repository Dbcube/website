<script setup lang="ts">
const route = useRoute();
const path = computed(() => route.path.replace(/\/$/, "")); // /blog/<slug>

const { data: post } = await useAsyncData(`blog-${path.value}`, () =>
  queryCollection("blog").path(path.value).first()
);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found", fatal: true });
}

// Surrounding posts for prev/next (newest first)
const { data: all } = await useAsyncData("blog-all-nav", () =>
  queryCollection("blog").order("date", "DESC").all()
);
const idx = computed(() => (all.value ?? []).findIndex((p: any) => p.path === path.value));
const newer = computed(() => (idx.value > 0 ? all.value![idx.value - 1] : null));
const older = computed(() => (all.value && idx.value < all.value.length - 1 ? all.value[idx.value + 1] : null));

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

const SITE = "https://dbcube.dev";
const abs = (p?: string) => (p ? (p.startsWith("http") ? p : SITE + p) : undefined);

useSeoMeta({
  title: () => `${post.value?.title} — Dbcube Blog`,
  description: () => post.value?.description,
  ogTitle: () => post.value?.title,
  ogDescription: () => post.value?.description,
  ogType: "article",
  ogImage: () => abs(post.value?.cover),
  twitterImage: () => abs(post.value?.cover),
  twitterCard: "summary_large_image",
});
</script>

<template>
  <article v-if="post" class="postx">
    <NuxtLink to="/blog" class="postx__back">← All posts</NuxtLink>

    <div class="postx__meta">
      <span v-for="t in post.tags || []" :key="t" class="tag">{{ t }}</span>
      <span class="dot">·</span>{{ fmtDate(post.date) }}
      <template v-if="post.readingTime"><span class="dot">·</span>{{ post.readingTime }}</template>
    </div>

    <h1 class="postx__title">{{ post.title }}</h1>
    <p class="postx__lede">{{ post.description }}</p>

    <div v-if="post.author" class="postx__author">
      <div class="postx__avatar">{{ post.author.charAt(0) }}</div>
      <div>
        <div class="postx__aname">{{ post.author }}</div>
        <div v-if="post.role" class="postx__arole">{{ post.role }}</div>
      </div>
    </div>

    <img v-if="post.cover" :src="post.cover" :alt="post.title" class="postx__cover" />

    <div class="postx__body">
      <ContentRenderer :value="post" />
    </div>

    <!-- prev / next -->
    <nav v-if="newer || older" class="postx__nav">
      <NuxtLink v-if="older" :to="older.path" class="navcard navcard--prev">
        <span class="navcard__k">← Older</span>
        <span class="navcard__t">{{ older.title }}</span>
      </NuxtLink>
      <span v-else />
      <NuxtLink v-if="newer" :to="newer.path" class="navcard navcard--next">
        <span class="navcard__k">Newer →</span>
        <span class="navcard__t">{{ newer.title }}</span>
      </NuxtLink>
    </nav>
  </article>
</template>

<style scoped>
.postx {
  --cyan: #22d3ee; --fg: #eef3f8; --muted: #93a1b0;
  --card: rgba(255, 255, 255, 0.03); --border: rgba(255, 255, 255, 0.1);
  max-width: 64rem; margin: 0 auto; padding: 2.5rem 2rem 6rem; color: var(--fg);
}
.postx__back { color: var(--muted); font-size: 0.9rem; text-decoration: none; }
.postx__back:hover { color: var(--cyan); }
.postx__meta { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;
  font-size: 0.82rem; color: var(--muted); margin: 1.6rem 0 0.8rem; }
.tag { font-size: 0.72rem; font-weight: 600; color: var(--cyan); text-transform: uppercase; letter-spacing: 0.04em; }
.dot { color: var(--muted); margin: 0 0.15rem; }
.postx__title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 850; letter-spacing: -0.03em; line-height: 1.05; }
.postx__lede { color: var(--muted); font-size: 1.15rem; line-height: 1.6; margin-top: 1rem; }
.postx__author { display: flex; align-items: center; gap: 0.7rem; margin-top: 1.5rem; }
.postx__avatar { width: 40px; height: 40px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center; font-weight: 700; color: #04060a;
  background: linear-gradient(135deg, var(--cyan), #3b82f6); }
.postx__aname { font-weight: 600; font-size: 0.92rem; }
.postx__arole { color: var(--muted); font-size: 0.8rem; }
.postx__cover { width: 100%; border-radius: 16px; margin: 2rem 0; border: 1px solid var(--border); }
.postx__body { font-size: 1.05rem; line-height: 1.75; }
.postx__body :deep(h2) { font-size: 1.7rem; font-weight: 800; letter-spacing: -0.02em; margin: 2.4rem 0 1rem; }
.postx__body :deep(h3) { font-size: 1.3rem; font-weight: 700; margin: 1.8rem 0 0.8rem; }
.postx__body :deep(p) { margin: 1rem 0; color: #cdd9e5; }
.postx__body :deep(a) { color: var(--cyan); text-decoration: underline; text-underline-offset: 3px; }
.postx__body :deep(ul), .postx__body :deep(ol) { margin: 1rem 0 1rem 1.3rem; color: #cdd9e5; }
.postx__body :deep(li) { margin: 0.4rem 0; }
.postx__body :deep(table) { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
.postx__body :deep(th), .postx__body :deep(td) { border: 1px solid var(--border); padding: 0.5rem 0.8rem; text-align: left; }
.postx__body :deep(th) { background: color-mix(in srgb, var(--cyan) 8%, transparent); }
.postx__body :deep(pre) { border-radius: 12px; padding: 1rem 1.2rem; overflow-x: auto;
  border: 1px solid var(--border); margin: 1.4rem 0; }
.postx__body :deep(.mermaid-diagram) { margin: 1.8rem 0; }
.postx__nav { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 3.5rem;
  border-top: 1px solid var(--border); padding-top: 2rem; }
.navcard { display: flex; flex-direction: column; gap: 0.3rem; padding: 1rem 1.2rem;
  border: 1px solid var(--border); border-radius: 12px; background: var(--card);
  text-decoration: none; color: inherit; transition: border-color 0.2s; }
.navcard:hover { border-color: color-mix(in srgb, var(--cyan) 45%, transparent); }
.navcard--next { text-align: right; }
.navcard__k { font-size: 0.78rem; color: var(--cyan); font-weight: 600; }
.navcard__t { font-weight: 600; font-size: 0.95rem; }
</style>
