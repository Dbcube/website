<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, ref } from "vue";

// Tema: usamos el color-mode de Nuxt para alternar variables dentro de MDC.
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

// ── Fondo animado del hero (LetterGlitch) — parámetros del panel de diseño ──
const glitchColors = ["#06B6D4", "#3B82F6", "#61b3dc"];

// Copiar el comando de instalación al portapapeles, con feedback breve.
const installCmd = "npm install dbcube";
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
const copyInstall = async () => {
  try {
    await navigator.clipboard.writeText(installCmd);
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 1600);
  } catch {
    /* clipboard no disponible: ignorar */
  }
};

const features = [
  { icon: "i-lucide-database", title: "Multi-database", desc: "MySQL, PostgreSQL, SQLite, MongoDB and Turso — one fluent API across every engine." },
  { icon: "i-lucide-cloud", title: "Cloud over TLS", desc: "Supabase, Neon, PlanetScale, Atlas, Turso. One URL, TLS on by default." },
  { icon: "i-lucide-zap", title: "Single-RTT transactions", desc: "db.batch() commits a whole sequence of writes in one network round-trip." },
  { icon: "i-lucide-file-text", title: ".cube schemas", desc: "Declarative tables, seeders and triggers in clean, reviewable files." },
  { icon: "i-lucide-sparkles", title: "Computed fields & triggers", desc: "Virtual columns and before/after hooks — built in, not bolted on." },
  { icon: "i-lucide-terminal", title: "Powerful CLI", desc: "Migrations with rollback, type generation, introspection, health doctor." },
];

// Real medians from the published benchmark suite (full run, PostgreSQL 16,
// pool ≤ 10). Same numbers as /performance and benchmarks/results/latest.md.
const compare: { op: string; db: number; prisma: number }[] = [
  { op: "SELECT by primary key", db: 1.15, prisma: 1.85 },
  { op: "Filtered list (LIMIT 20)", db: 1.10, prisma: 1.53 },
  { op: "COUNT with filter", db: 0.83, prisma: 1.09 },
  { op: "Transaction (2 writes)", db: 2.15, prisma: 4.70 },
  { op: "Bulk INSERT 1,000 rows", db: 16.5, prisma: 23.6 },
  { op: "100 concurrent lookups", db: 8.29, prisma: 9.35 },
];
const compareRows = computed(() =>
  compare.map((r) => {
    const max = Math.max(r.db, r.prisma);
    const speed = r.prisma / r.db;
    const tie = Math.abs(speed - 1) <= 0.02;
    return {
      ...r,
      dbW: (r.db / max) * 100,
      prismaW: (r.prisma / max) * 100,
      tie,
      label: tie ? "≈ tied" : `${speed.toFixed(2)}× faster`,
    };
  })
);

const clouds = [
  { name: "Supabase", kind: "PostgreSQL" },
  { name: "Neon", kind: "PostgreSQL" },
  { name: "PlanetScale", kind: "MySQL" },
  { name: "MongoDB Atlas", kind: "MongoDB" },
  { name: "Turso", kind: "libSQL" },
  { name: "AWS RDS", kind: "Postgres / MySQL" },
];

// Scroll-reveal: añade .is-visible a [data-reveal] al entrar en viewport.
let observer: IntersectionObserver | null = null;
onMounted(() => {
  const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          observer?.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => observer!.observe(el));
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="dbx" :class="{ 'dbx--dark': isDark }">
    <!-- ════════ HERO — banner estático con fondo LetterGlitch ════════ -->
    <section class="hero">
      <div class="hero__bg" aria-hidden="true">
        <ClientOnly>
          <LetterGlitch
            :glitch-colors="glitchColors"
            :glitch-speed="45"
            :smooth="true"
            :center-vignette="true"
            :outer-vignette="true"
          />
        </ClientOnly>
      </div>
      <div class="hero__scrim" aria-hidden="true" />

      <div class="hero__content">
        <span class="hero__chip" data-reveal>
          <span class="hero__chip-dot" />
          Rust-powered engine · v1.1.3
        </span>

        <h1 class="hero__title" data-reveal>
          The ORM that<br />
          <span class="hero__grad">outruns them all.</span>
        </h1>

        <p class="hero__sub" data-reveal>
          A type-safe, Rust-powered engine for PostgreSQL, MySQL, SQLite,
          MongoDB &amp; Turso. <strong>One API for every database</strong> — and the
          shortest path from your code to your data.
        </p>

        <div class="hero__cta" data-reveal>
          <NuxtLink to="/getting-started/installation" class="btn btn--primary">
            Get started →
          </NuxtLink>
          <a href="https://github.com/Dbcube" target="_blank" class="btn btn--ghost">
            Star on GitHub
          </a>
        </div>

        <div class="hero__install" data-reveal>
          <code><span class="hero__dollar">$</span> npm install dbcube</code>
          <button
            class="copy-btn"
            type="button"
            :aria-label="copied ? 'Command copied' : 'Copy command'"
            :title="copied ? 'Copied!' : 'Copy'"
            @click="copyInstall"
          >
            <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="copy-btn__icon" />
            <span class="copy-btn__label">{{ copied ? 'Copied' : 'Copy' }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ════════ CODE IN ACTION ════════ -->
    <section class="block">
      <div class="block__head" data-reveal>
        <h2 class="block__title">See it in action</h2>
        <p class="block__sub">The same fluent, typed API for reads, writes and transactions.</p>
      </div>
      <div class="playground" data-reveal>
        <ClientOnly>
          <PlaygroundTerminal />
        </ClientOnly>
      </div>
    </section>

    <!-- ════════ FEATURES ════════ -->
    <section class="block">
      <div class="block__head" data-reveal>
        <h2 class="block__title">Everything, batteries included</h2>
        <p class="block__sub">One package. Every database. No vendor lock-in.</p>
      </div>
      <div class="feat__grid">
        <div v-for="(f, i) in features" :key="f.title" class="feat" data-reveal :style="{ transitionDelay: `${i * 60}ms` }">
          <div class="feat__icon"><UIcon :name="f.icon" /></div>
          <h3 class="feat__title">{{ f.title }}</h3>
          <p class="feat__desc">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ════════ COMPARISON ════════ -->
    <section class="block">
      <div class="block__head" data-reveal>
        <h2 class="block__title">Benchmarked, not claimed</h2>
        <p class="block__sub">
          Real PostgreSQL 16, same machine, same connection budget. Median latency, lower is better.
        </p>
      </div>
      <div class="bench" data-reveal>
        <div v-for="row in compareRows" :key="row.op" class="bench__row">
          <div class="bench__op">{{ row.op }}</div>
          <div class="bench__lines">
            <div class="bench__line">
              <span class="bench__name bench__name--db">Dbcube</span>
              <div class="bench__track"><div class="bench__fill bench__fill--db" :style="{ width: row.dbW + '%' }" /></div>
              <span class="bench__num bench__num--db">{{ row.db }} ms</span>
            </div>
            <div class="bench__line">
              <span class="bench__name">Prisma</span>
              <div class="bench__track"><div class="bench__fill bench__fill--rival" :style="{ width: row.prismaW + '%' }" /></div>
              <span class="bench__num">{{ row.prisma }} ms</span>
            </div>
          </div>
          <div class="bench__chip" :class="{ 'bench__chip--tie': row.tie }">{{ row.label }}</div>
        </div>
      </div>
      <p class="cmp__foot" data-reveal>
        <NuxtLink to="/performance/benchmarks">Run the benchmarks yourself →</NuxtLink>
      </p>
    </section>

    <!-- ════════ CLOUD ════════ -->
    <section class="block">
      <div class="block__head" data-reveal>
        <h2 class="block__title">Local today, cloud tomorrow</h2>
        <p class="block__sub">One connection string. TLS on by default. Zero code changes.</p>
      </div>
      <div class="clouds" data-reveal>
        <code class="clouds__url">
          <span class="clouds__key">DATABASE_URL=</span>"…@your-host:5432/app?<span class="clouds__tls">sslmode=require</span>"
        </code>
        <div class="clouds__tags">
          <span v-for="c in clouds" :key="c.name" class="ctag">
            <span class="ctag__dot" />{{ c.name }}<em>{{ c.kind }}</em>
          </span>
        </div>
      </div>
    </section>

    <!-- ════════ FINAL CTA ════════ -->
    <section class="final" data-reveal>
      <h2 class="final__title">Ready to be the fastest?</h2>
      <p class="final__sub">Build your first query in under five minutes.</p>
      <div class="final__install">
        <code><span class="hero__dollar">$</span> npm install dbcube</code>
        <button
          class="copy-btn"
          type="button"
          :aria-label="copied ? 'Command copied' : 'Copy command'"
          :title="copied ? 'Copied!' : 'Copy'"
          @click="copyInstall"
        >
          <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" class="copy-btn__icon" />
          <span class="copy-btn__label">{{ copied ? 'Copied' : 'Copy' }}</span>
        </button>
      </div>
      <div class="hero__cta">
        <NuxtLink to="/getting-started/introduction" class="btn btn--primary">Read the docs →</NuxtLink>
        <a href="https://github.com/Dbcube" target="_blank" class="btn btn--ghost">View on GitHub</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dbx {
  --cyan: #22d3ee;
  /* claro por defecto */
  --bg: #ffffff;
  --fg: #0a0e14;
  --muted: #5b6675;
  --card: rgba(0, 0, 0, 0.02);
  --border: rgba(0, 0, 0, 0.08);
  /* rompe el contenedor de docs para ocupar todo el ancho */
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  background: var(--bg);
  color: var(--fg);
}
.dbx--dark {
  --bg: #000;
  --fg: #eef3f8;
  --muted: #8a97a6;
  --card: rgba(255, 255, 255, 0.03);
  --border: rgba(255, 255, 255, 0.08);
}

[data-reveal] {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
[data-reveal].is-visible { opacity: 1; transform: none; }

/* ── HERO — banner estático (fondo LetterGlitch + contenido centrado) ── */
.hero {
  position: relative;
  width: 100vw;
  min-height: calc(100vh - var(--ui-header-height, 4rem));
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: clamp(4rem, 10vh, 8rem) clamp(1.25rem, 6vw, 4rem);
  /* paleta fija oscura para el banner, sin importar el tema */
  background: #000;
  color: #eef3f8;
  overflow: hidden;
  isolation: isolate;
}
/* Fondo animado de letras: ocupa todo el hero, detrás del contenido */
.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.hero__bg :deep(.lg) { background-color: #000; }
/* Scrim extra tras el texto: garantiza contraste del título sobre el glitch,
   además de la center-vignette del propio componente. */
.hero__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 55% at 50% 48%, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.35) 45%, transparent 72%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, transparent 22%, transparent 78%, rgba(0, 0, 0, 0.5) 100%);
}
.hero__content {
  position: relative;
  z-index: 2;
  max-width: 46rem;
  text-shadow: 0 2px 28px rgba(0, 0, 0, 0.85);
}
.hero__chip {
  display: inline-flex; align-items: center; gap: 0.55rem;
  font-size: 0.8rem; font-weight: 600; letter-spacing: 0.01em;
  padding: 0.42rem 0.95rem; border-radius: 999px; margin-bottom: 1.7rem;
  border: 1px solid color-mix(in srgb, var(--cyan) 40%, transparent);
  background: rgba(6, 12, 18, 0.55);
  backdrop-filter: blur(8px);
  color: #dbf3fb;
}
.hero__chip-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--cyan);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--cyan) 70%, transparent);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--cyan) 60%, transparent); }
  70% { box-shadow: 0 0 0 10px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
.hero__title {
  font-size: clamp(2.6rem, 7vw, 5rem); font-weight: 800;
  line-height: 1.03; letter-spacing: -0.03em; margin: 0 0 1.4rem;
}
.hero__grad {
  background: linear-gradient(120deg, var(--cyan), #3b82f6 55%, #a855f7);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero__sub {
  font-size: clamp(1rem, 2vw, 1.25rem); color: #c3cede;
  max-width: 40rem; margin: 0 auto 2.2rem; line-height: 1.6;
}
.hero__sub strong { color: #fff; font-weight: 600; }
.hero__cta { display: flex; gap: 0.9rem; justify-content: center; flex-wrap: wrap; }
.btn {
  display: inline-flex; align-items: center; font-weight: 600; font-size: 0.95rem;
  padding: 0.8rem 1.5rem; border-radius: 999px;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
}
.btn--primary {
  background: var(--cyan); color: #04060a;
  box-shadow: 0 0 40px -8px color-mix(in srgb, var(--cyan) 70%, transparent);
}
.btn--primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 0 55px -5px var(--cyan); }
.btn--ghost { border: 1px solid rgba(255, 255, 255, 0.18); color: #eef3f8; background: rgba(255, 255, 255, 0.04); }
.btn--ghost:hover { transform: translateY(-2px); border-color: var(--cyan); }
.hero__install {
  margin-top: 2.2rem; font-family: ui-monospace, monospace; font-size: 0.9rem;
  display: inline-flex; align-items: center; gap: 0.5rem;
}
.hero__install code {
  display: inline-flex; align-items: center;
  padding: 0.6rem 1.3rem; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--cyan) 30%, transparent);
  background: rgba(8, 14, 20, 0.7);
  backdrop-filter: blur(8px);
  color: #cfe8f2; letter-spacing: 0.02em;
  box-shadow: 0 0 24px rgba(34, 211, 238, 0.12);
}
.hero__dollar { color: var(--cyan); margin-right: 0.6rem; font-weight: 700; }

/* Botón "copiar comando" */
.copy-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.5rem 0.8rem; border-radius: 999px; cursor: pointer;
  font-family: inherit; font-size: 0.8rem; line-height: 1;
  color: #cfe8f2;
  border: 1px solid color-mix(in srgb, var(--cyan) 30%, transparent);
  background: rgba(8, 14, 20, 0.7);
  backdrop-filter: blur(8px);
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease, transform 0.08s ease;
}
.copy-btn:hover { color: #fff; border-color: color-mix(in srgb, var(--cyan) 60%, transparent); background: rgba(34, 211, 238, 0.12); }
.copy-btn:active { transform: translateY(1px); }
.copy-btn__icon { width: 1rem; height: 1rem; }
.copy-btn__label { font-weight: 600; letter-spacing: 0.02em; }

/* ── BLOCKS ── */
.block { max-width: 72rem; margin: 0 auto; padding: 6rem 1.5rem; }
.block__head { text-align: center; margin-bottom: 3rem; }
.block__title { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; letter-spacing: -0.02em; }
.block__sub { color: var(--muted); margin-top: 0.7rem; font-size: 1.05rem; }
.playground { max-width: 52rem; margin: 0 auto; }

/* ── FEATURES ── */
.feat__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2rem; }
@media (max-width: 860px) { .feat__grid { grid-template-columns: 1fr; } }
.feat {
  padding: 1.6rem; border-radius: 14px; border: 1px solid var(--border); background: var(--card);
  transition: transform 0.2s, border-color 0.2s, opacity 0.7s;
}
.feat:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--cyan) 40%, transparent); }
.feat__icon {
  width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--cyan) 12%, transparent); color: var(--cyan); font-size: 1.3rem; margin-bottom: 1rem;
}
.feat__title { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.4rem; }
.feat__desc { color: var(--muted); font-size: 0.92rem; line-height: 1.55; }

/* ── COMPARISON (barras Dbcube vs Prisma) ── */
.bench { max-width: 56rem; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
.bench__row {
  display: grid; grid-template-columns: 13rem 1fr 7rem; gap: 1.4rem; align-items: center;
  padding-bottom: 1.4rem; border-bottom: 1px solid var(--border);
}
.bench__row:last-child { border-bottom: none; padding-bottom: 0; }
.bench__op { font-weight: 600; font-size: 0.95rem; }
.bench__lines { display: flex; flex-direction: column; gap: 0.5rem; }
.bench__line { display: grid; grid-template-columns: 4.5rem 1fr 4.2rem; gap: 0.7rem; align-items: center; }
.bench__name { font-size: 0.78rem; color: var(--muted); }
.bench__name--db { color: var(--fg); font-weight: 600; }
.bench__track { height: 0.7rem; background: rgba(127, 127, 127, 0.14); border-radius: 999px; overflow: hidden; }
.bench__fill { height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.bench__fill--db { background: linear-gradient(90deg, var(--cyan), #3b82f6); box-shadow: 0 0 14px color-mix(in srgb, var(--cyan) 45%, transparent); }
.bench__fill--rival { background: rgba(127, 127, 127, 0.35); }
.bench__num { font-family: ui-monospace, monospace; font-size: 0.8rem; text-align: right; color: var(--muted); }
.bench__num--db { color: var(--cyan); font-weight: 700; }
.bench__chip {
  text-align: center; font-weight: 700; font-size: 0.8rem; color: var(--cyan);
  border: 1px solid color-mix(in srgb, var(--cyan) 35%, transparent); border-radius: 999px;
  padding: 0.35rem 0.4rem; background: color-mix(in srgb, var(--cyan) 8%, transparent);
}
.bench__chip--tie { color: var(--muted); border-color: var(--border); background: transparent; }
@media (max-width: 720px) {
  .bench__row { grid-template-columns: 1fr; gap: 0.7rem; }
  .bench__chip { justify-self: start; }
}
.cmp__foot { text-align: center; margin-top: 2.2rem; }
.cmp__foot a { color: var(--cyan); font-weight: 600; }

/* ── CLOUDS ── */
.clouds { max-width: 52rem; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 2rem; }
.clouds__url {
  font-family: ui-monospace, monospace; font-size: clamp(0.8rem, 1.6vw, 1rem); color: #cfe8f2;
  padding: 0.85rem 1.3rem; border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--cyan) 28%, transparent);
  background: rgba(8, 14, 20, 0.7); box-shadow: 0 0 30px -10px color-mix(in srgb, var(--cyan) 60%, transparent);
  max-width: 100%; overflow-x: auto; white-space: nowrap;
}
.clouds__key { color: var(--cyan); font-weight: 700; }
.clouds__tls { color: #7fe0ff; text-decoration: underline; text-underline-offset: 3px; }
.clouds__tags { display: flex; flex-wrap: wrap; gap: 0.7rem; justify-content: center; }
.ctag {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.55rem 1rem; border-radius: 999px; border: 1px solid var(--border); background: var(--card);
  font-weight: 600; font-size: 0.92rem; color: var(--fg);
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.ctag em {
  font-style: normal; font-size: 0.72rem; color: var(--muted); font-weight: 500;
  padding-left: 0.5rem; border-left: 1px solid var(--border);
}
.ctag__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 8px var(--cyan); flex: none; }
.ctag:hover {
  border-color: color-mix(in srgb, var(--cyan) 50%, transparent); transform: translateY(-2px);
  box-shadow: 0 0 22px -8px color-mix(in srgb, var(--cyan) 55%, transparent);
}

/* ── FINAL ── */
.final { text-align: center; padding: 7rem 1.5rem; border-top: 1px solid var(--border); }
.final .hero__cta { justify-content: center; }
.final__title { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em; }
.final__sub { color: var(--muted); margin: 0.8rem 0 1.8rem; font-size: 1.1rem; }
.final__install { margin-bottom: 2rem; font-family: ui-monospace, monospace; display: inline-flex; align-items: center; gap: 0.5rem; }
.final__install code { padding: 0.7rem 1.3rem; border-radius: 8px; border: 1px solid var(--border); background: var(--card); }
</style>
