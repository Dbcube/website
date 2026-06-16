<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, ref } from "vue";

// Tema: usamos el color-mode de Nuxt directamente para alternar las variables,
// sin depender de que el selector global `.dark` quede como ancestro del
// contenido renderizado por MDC (que a veces no aplica dentro de scoped CSS).
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

// ── Scrollytelling del hero ──
// El `.hero` es un track alto; su `.hero__stage` queda pineado (sticky) mientras
// se recorre el track. `progress` (0→1) mide cuánto se ha avanzado dentro del
// track y se usa para que el cubo descienda, encoja y entre al chip.
const heroEl = ref<HTMLElement | null>(null);
const progress = ref(0);

let onScroll: (() => void) | null = null;
onMounted(() => {
  const headerPx =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui-header-height")) || 64;
  const compute = () => {
    const el = heroEl.value;
    if (!el) return;
    const stageH = window.innerHeight - headerPx; // alto del stage pineado
    const trackLen = el.offsetHeight - stageH; // distancia que el stage permanece pineado
    const scrolled = headerPx - el.getBoundingClientRect().top; // cuánto se avanzó en el track
    progress.value = trackLen > 0 ? Math.min(Math.max(scrolled / trackLen, 0), 1) : 0;
  };
  onScroll = () => requestAnimationFrame(compute);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  compute();
});
onBeforeUnmount(() => {
  if (onScroll) {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  }
});

// Fase 2 del scroll (debe coincidir con PHASE1 del componente 3D = 0.45):
// el canvas vuelve al centro y el título sube y se desvanece.
const PHASE1 = 0.45;
const phase2 = computed(() => Math.max((progress.value - PHASE1) / (1 - PHASE1), 0));
// canvas: de translate(25%,-7%) → (0,0) (se centra al volverse cuadrado)
const canvasStyle = computed(() => {
  const k = 1 - phase2.value;
  return { transform: `translate(${25 * k}%, ${-7 * k}%)` };
});
// título: mantiene su posición en fase 1 y "continúa su recorrido" (sube y se va) en fase 2
const contentStyle = computed(() => ({
  transform: `translate(30%, ${-phase2.value * 60}vh)`,
  opacity: 1 - Math.min(phase2.value * 1.4, 1),
}));

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

const features = [
  { icon: "i-lucide-database", title: "Multi-database", desc: "MySQL, PostgreSQL, SQLite, MongoDB and Turso — one fluent API across every engine." },
  { icon: "i-lucide-cloud", title: "Cloud over TLS", desc: "Supabase, Neon, PlanetScale, Atlas, Turso. One URL, TLS on by default." },
  { icon: "i-lucide-zap", title: "Single-RTT transactions", desc: "db.batch() commits a whole sequence of writes in one network round-trip." },
  { icon: "i-lucide-file-text", title: ".cube schemas", desc: "Declarative tables, seeders and triggers in clean, reviewable files." },
  { icon: "i-lucide-sparkles", title: "Computed fields & triggers", desc: "Virtual columns and before/after hooks — built in, not bolted on." },
  { icon: "i-lucide-terminal", title: "Powerful CLI", desc: "Migrations with rollback, type generation, introspection, health doctor." },
];

const compare: [string, string, string, boolean][] = [
  ["SELECT by primary key", "0.73 ms", "1.01 ms", true],
  ["UPDATE by primary key", "1.41 ms", "1.82 ms", true],
  ["Transaction (2 writes)", "2.07 ms", "3.82 ms", true],
  ["Bulk INSERT 1,000 rows", "14.9 ms", "21.6 ms", true],
  ["Relation load (50+orders)", "3.28 ms", "4.55 ms", true],
  ["100 concurrent lookups", "8.05 ms", "8.04 ms", false],
];

const clouds = ["Supabase", "Neon", "PlanetScale", "MongoDB Atlas", "Turso", "AWS RDS"];
</script>

<template>
  <div class="dbx" :class="{ 'dbx--dark': isDark }">
    <!-- ════════ HERO (track alto; el stage se queda pineado durante el scroll) ════════ -->
    <section ref="heroEl" class="hero">
      <div class="hero__stage">
        <div class="hero__canvas" :style="canvasStyle">
          <ClientOnly>
            <BlackHoleCube :progress="progress" />
          </ClientOnly>
        </div>
        <div class="hero__veil" />

        <div class="hero__content" :style="contentStyle">
          <h1 class="hero__title" data-reveal>
            The ORM that<br />
            <span class="hero__grad">outruns Prisma.</span>
          </h1>

          <p class="hero__sub" data-reveal>
            A type-safe, Rust-powered query engine for MySQL, PostgreSQL, SQLite,
            MongoDB &amp; Turso. <strong>Write once, run anywhere</strong> — local or
            in the cloud, the same API and the fastest path to your data.
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
          </div>
        </div>

        <div class="hero__scroll" aria-hidden="true">↓ scroll</div>
      </div>
    </section>

    <!-- ════════ STAT BAND ════════ -->
    <section class="stats" data-reveal>
      <div class="stats__grid">
        <div class="stat">
          <div class="stat__num">8/9</div>
          <div class="stat__lbl">operations beat Prisma</div>
        </div>
        <div class="stat">
          <div class="stat__num">0.73<span>ms</span></div>
          <div class="stat__lbl">primary-key read</div>
        </div>
        <div class="stat">
          <div class="stat__num">5</div>
          <div class="stat__lbl">databases, one API</div>
        </div>
        <div class="stat">
          <div class="stat__num">1</div>
          <div class="stat__lbl">round-trip transactions</div>
        </div>
      </div>
    </section>

    <!-- ════════ PLAYGROUND ════════ -->
    <section class="block">
      <div class="block__head" data-reveal>
        <h2 class="block__title">See it move</h2>
        <p class="block__sub">The same fluent API for reads, writes, transactions and the CLI.</p>
      </div>
      <div class="playground" data-reveal>
        <PlaygroundTerminal />
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
      <div class="cmp" data-reveal>
        <div class="cmp__row cmp__row--head">
          <span>Operation</span><span class="cmp__db">DBCube</span><span>Prisma</span>
        </div>
        <div v-for="row in compare" :key="row[0]" class="cmp__row">
          <span class="cmp__op">{{ row[0] }}</span>
          <span class="cmp__db" :class="{ 'cmp__win': row[3] }">{{ row[1] }}</span>
          <span class="cmp__rival">{{ row[2] }}</span>
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
        <span v-for="c in clouds" :key="c" class="cloud">{{ c }}</span>
      </div>
    </section>

    <!-- ════════ FINAL CTA ════════ -->
    <section class="final" data-reveal>
      <h2 class="final__title">Ready to be the fastest?</h2>
      <p class="final__sub">Build your first query in under five minutes.</p>
      <div class="final__install"><code><span class="hero__dollar">$</span> npm install dbcube</code></div>
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
/* oscuro: clase aplicada por useColorMode (infalible dentro de MDC) */
.dbx--dark {
  --bg: #04060a;
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

/* ── HERO ──
   `.hero` es un TRACK alto: da la distancia de scroll para la animación.
   `.hero__stage` queda pineado (sticky) y ocupa la pantalla mientras el track
   se recorre; el progreso del scroll controla la entrada del cubo al chip. */
.hero {
  position: relative;
  width: 100vw;
  height: 260vh; /* track: distancia de scroll para las 2 fases (cubo + placa) */
  /* paleta fija oscura, sin importar el tema del resto de la página */
  --bg: #04060a;
  --fg: #eef3f8;
  --muted: #93a1b0;
  --card: rgba(255, 255, 255, 0.04);
  --border: rgba(255, 255, 255, 0.1);
  background: #000;
  color: var(--fg);
}
.hero__stage {
  position: sticky;
  top: var(--ui-header-height, 4rem);
  height: calc(100vh - var(--ui-header-height, 4rem));
  min-height: 520px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  overflow: hidden;
  padding: 0 clamp(1.5rem, 7vw, 8rem);
  background: #000;
}
/* Escena 3D corrida a la derecha y subida ~10% (sin tocar los parámetros 3D);
   el área que queda expuesta a la izquierda/abajo es negra = fondo del hero. */
.hero__canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  transform: translate(25%, -7%);
}
/* Oscurecido a la izquierda para legibilidad del texto; la derecha (escena) queda libre */
.hero__veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(4, 5, 7, 0.78) 0%, rgba(4, 5, 7, 0.4) 38%, transparent 62%),
    linear-gradient(180deg, transparent 75%, rgba(4, 5, 7, 0.5) 100%);
  pointer-events: none;
}
.hero__content {
  position: relative;
  z-index: 2;
  max-width: 38rem;
  /* corrido ~30% a la derecha respecto al borde izquierdo */
  transform: translateX(30%);
  text-shadow: 0 2px 24px rgba(4, 5, 7, 0.8);
}
.hero__badge {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-size: 0.8rem; font-weight: 500;
  padding: 0.4rem 0.9rem; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--cyan) 35%, transparent);
  background: color-mix(in srgb, var(--cyan) 8%, transparent);
  color: var(--fg); margin-bottom: 1.6rem;
}
.hero__pulse {
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
  font-size: clamp(2.6rem, 7vw, 5.2rem); font-weight: 800;
  line-height: 1.02; letter-spacing: -0.03em; margin: 0 0 1.4rem;
}
.hero__grad {
  background: linear-gradient(120deg, var(--cyan), #3b82f6 55%, #a855f7);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero__sub {
  font-size: clamp(1rem, 2vw, 1.25rem); color: var(--muted);
  max-width: 36rem; margin: 0 0 2.2rem; line-height: 1.6;
}
.hero__sub strong { color: var(--fg); font-weight: 600; }
.hero__cta { display: flex; gap: 0.9rem; justify-content: flex-start; flex-wrap: wrap; }
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
.btn--ghost { border: 1px solid var(--border); color: var(--fg); background: var(--card); }
.btn--ghost:hover { transform: translateY(-2px); border-color: var(--cyan); }
.hero__install { margin-top: 2.2rem; font-family: ui-monospace, monospace; font-size: 0.9rem; }
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
.hero__scroll {
  position: absolute; bottom: 5%; left: 50%; z-index: 2;
  font-size: 0.75rem; letter-spacing: 0.1em; color: var(--muted);
  animation: bob 2s ease-in-out infinite;
}
@keyframes bob { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 6px); } }

/* ── STATS ── */
.stats { padding: 4rem 1.5rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.stats__grid { max-width: 64rem; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; text-align: center; }
@media (max-width: 640px) { .stats__grid { grid-template-columns: repeat(2, 1fr); } }
.stat__num {
  font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 800; letter-spacing: -0.03em;
  background: linear-gradient(120deg, var(--cyan), #3b82f6);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.stat__num span { font-size: 0.45em; }
.stat__lbl { color: var(--muted); font-size: 0.85rem; margin-top: 0.4rem; }

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

/* ── COMPARISON ── */
.cmp { max-width: 50rem; margin: 0 auto; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--card); }
.cmp__row { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 0.85rem 1.4rem; align-items: center; border-top: 1px solid var(--border); font-size: 0.92rem; }
.cmp__row:first-child { border-top: none; }
.cmp__row--head { font-weight: 700; background: color-mix(in srgb, var(--cyan) 6%, transparent); }
.cmp__op { color: var(--muted); }
.cmp__db { text-align: right; font-family: ui-monospace, monospace; font-weight: 700; }
.cmp__rival { text-align: right; font-family: ui-monospace, monospace; color: var(--muted); }
.cmp__win { color: var(--cyan); }
.cmp__foot { text-align: center; margin-top: 1.5rem; }
.cmp__foot a { color: var(--cyan); font-weight: 600; }

/* ── CLOUDS ── */
.clouds { display: flex; flex-wrap: wrap; gap: 0.8rem; justify-content: center; }
.cloud {
  padding: 0.6rem 1.3rem; border-radius: 999px; border: 1px solid var(--border); background: var(--card);
  font-weight: 600; font-size: 0.95rem; color: var(--fg); transition: border-color 0.2s, transform 0.2s;
}
.cloud:hover { border-color: var(--cyan); transform: translateY(-2px); }

/* ── FINAL ── */
.final { text-align: center; padding: 7rem 1.5rem; border-top: 1px solid var(--border); }
.final__title { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em; }
.final__sub { color: var(--muted); margin: 0.8rem 0 1.8rem; font-size: 1.1rem; }
.final__install { margin-bottom: 2rem; font-family: ui-monospace, monospace; }
.final__install code { padding: 0.7rem 1.3rem; border-radius: 8px; border: 1px solid var(--border); background: var(--card); }
</style>
