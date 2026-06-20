<script setup lang="ts">
// Blog index: featured post on top, the rest in a grid, newest first.
const { data: posts } = await useAsyncData("blog-list", () =>
  queryCollection("blog").order("date", "DESC").all()
);

const featured = computed(() => posts.value?.find((p: any) => p.featured) ?? posts.value?.[0] ?? null);
const rest = computed(() => (posts.value ?? []).filter((p: any) => p.path !== featured.value?.path));

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

// The blog index preview shows the featured post's cover.
const SITE = "https://dbcube.dev";
const abs = (p?: string) => (p ? (p.startsWith("http") ? p : SITE + p) : `${SITE}/home.png`);

useSeoMeta({
  title: "Blog — Dbcube",
  description: "Launches, deep dives and engineering notes from the Dbcube team.",
  ogTitle: "The Dbcube Blog",
  ogDescription: "Launches, deep dives and engineering notes from the Dbcube team.",
  ogImage: () => abs(featured.value?.cover),
  twitterImage: () => abs(featured.value?.cover),
  twitterCard: "summary_large_image",
});
</script>

<template>
  <div class="blogx">
    <header class="blogx__head">
      <h1 class="blogx__title">The Dbcube <span class="g">Blog</span></h1>
      <p class="blogx__sub">Launches, deep dives and engineering notes.</p>
    </header>

    <!-- Featured -->
    <NuxtLink v-if="featured" :to="featured.path" class="feat">
      <div class="feat__media">
        <img v-if="featured.cover" :src="featured.cover" :alt="featured.title" />
        <div v-else class="feat__ph" />
      </div>
      <div class="feat__body">
        <span class="feat__flag">★ Featured</span>
        <div class="feat__meta">
          <span v-for="t in featured.tags || []" :key="t" class="tag">{{ t }}</span>
          <span class="dot">·</span>{{ fmtDate(featured.date) }}
          <template v-if="featured.readingTime"><span class="dot">·</span>{{ featured.readingTime }}</template>
        </div>
        <h2 class="feat__h">{{ featured.title }}</h2>
        <p class="feat__d">{{ featured.description }}</p>
        <span class="feat__cta">Read the post →</span>
      </div>
    </NuxtLink>

    <!-- Grid -->
    <div v-if="rest.length" class="grid">
      <NuxtLink v-for="p in rest" :key="p.path" :to="p.path" class="card">
        <div class="card__media">
          <img v-if="p.cover" :src="p.cover" :alt="p.title" />
          <div v-else class="card__ph" />
        </div>
        <div class="card__body">
          <div class="card__meta">
            <span v-for="t in p.tags || []" :key="t" class="tag">{{ t }}</span>
            <span class="dot">·</span>{{ fmtDate(p.date) }}
          </div>
          <h3 class="card__h">{{ p.title }}</h3>
          <p class="card__d">{{ p.description }}</p>
        </div>
      </NuxtLink>
    </div>

    <p v-if="!posts || !posts.length" class="empty">No posts yet — check back soon.</p>
  </div>
</template>

<style scoped>
.blogx {
  --cyan: #22d3ee;
  --fg: #eef3f8; --muted: #93a1b0;
  --card: rgba(255, 255, 255, 0.03); --border: rgba(255, 255, 255, 0.1);
  max-width: 76rem; margin: 0 auto; padding: 3.5rem 2rem 6rem; color: var(--fg);
}
.g { background: linear-gradient(120deg, var(--cyan), #3b82f6 55%, #a855f7);
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.blogx__head { text-align: center; margin-bottom: 3rem; }
.blogx__title { font-size: clamp(2.2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em; }
.blogx__sub { color: var(--muted); margin-top: 0.6rem; font-size: 1.1rem; }
.tag { font-size: 0.72rem; font-weight: 600; color: var(--cyan); text-transform: uppercase; letter-spacing: 0.04em; }
.dot { color: var(--muted); margin: 0 0.15rem; }

/* Featured */
.feat {
  display: grid; grid-template-columns: 1.1fr 1fr; gap: 0; margin-bottom: 3rem;
  border: 1px solid var(--border); border-radius: 18px; overflow: hidden; background: var(--card);
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; text-decoration: none; color: inherit;
}
.feat:hover { border-color: color-mix(in srgb, var(--cyan) 45%, transparent);
  transform: translateY(-3px); box-shadow: 0 0 50px -18px color-mix(in srgb, var(--cyan) 70%, transparent); }
.feat__media { overflow: hidden; height: 100%; min-height: 100%; }
.feat__media img { width: 100%; height: 100%; object-fit: cover; display: block; }
@media (max-width: 760px) { .feat__media { aspect-ratio: 1200 / 630; height: auto; min-height: 0; } }
.feat__ph, .card__ph { width: 100%; height: 100%; background: linear-gradient(135deg, #06141b, #0a0e14); }
.feat__body { padding: 2rem 2.2rem; display: flex; flex-direction: column; gap: 0.7rem; }
.feat__flag { font-size: 0.75rem; font-weight: 700; color: var(--cyan); letter-spacing: 0.05em; }
.feat__meta, .card__meta { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; font-size: 0.8rem; color: var(--muted); }
.feat__h { font-size: clamp(1.5rem, 3vw, 2.1rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
.feat__d { color: var(--muted); line-height: 1.6; }
.feat__cta { color: var(--cyan); font-weight: 600; margin-top: auto; }
@media (max-width: 760px) { .feat { grid-template-columns: 1fr; } }

/* Grid */
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.4rem; }
@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
.card { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 14px;
  overflow: hidden; background: var(--card); text-decoration: none; color: inherit;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s; }
.card:hover { border-color: color-mix(in srgb, var(--cyan) 45%, transparent);
  transform: translateY(-3px); box-shadow: 0 0 34px -14px color-mix(in srgb, var(--cyan) 65%, transparent); }
.card__media { aspect-ratio: 1200 / 630; overflow: hidden; }
.card__media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card__body { padding: 1.1rem 1.2rem 1.4rem; display: flex; flex-direction: column; gap: 0.5rem; }
.card__h { font-size: 1.1rem; font-weight: 700; line-height: 1.25; }
.card__d { color: var(--muted); font-size: 0.9rem; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.empty { text-align: center; color: var(--muted); padding: 3rem 0; }
</style>
