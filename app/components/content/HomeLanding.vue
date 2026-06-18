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

// ── Scrollytelling en 4 fases (mismos umbrales que BlackHoleCube) ──
//  F1 cubo→chip (0–0.18) · F2 aplanar(0.22–0.36)+encoger+bases(0.43–0.60)
//  F3 stats (0.60–0.78) · F4 (0.80–1) tubos caen+chispean, placa baja, cubo→izq + terminal.
const seg = (a: number, b: number) => Math.min(Math.max((progress.value - a) / (b - a), 0), 1);
const flatten = computed(() => seg(0.22, 0.36)); // la placa se acomoda
const dbDrawIn = computed(() => seg(0.43, 0.5)); // los tubos se dibujan
const dbRetract = computed(() => seg(0.54, 0.6)); // los tubos se retraen (reversa)
const dashFactor = computed(() => 1 - dbDrawIn.value - dbRetract.value); // 1→0 (dibuja) → -1 (retrae)
const statsIn = computed(() => seg(0.69, 0.76)); // los números aparecen ya posicionado
const statsOut = computed(() => seg(0.78, 0.82)); // los números se van al iniciar la fase 4
const cubeLeftT = computed(() => seg(0.87, 0.91)); // el cubo se va a la izquierda
const terminalIn = computed(() => seg(0.89, 0.92)); // aparece el terminal a la derecha
// FASE 5: el cubo vuelve al centro, el terminal se va, los cubitos explotan
const cubeCenterT = computed(() => seg(0.93, 0.97)); // el cubo regresa al centro (revierte la X)
const terminalOut = computed(() => seg(0.93, 0.96)); // el terminal se va
const poweredIn = computed(() => seg(0.96, 1)); // aparece "Powered by Rust"

// canvas: centra al acomodarse; en F4 va a la IZQUIERDA y baja; en F5 vuelve al centro (X)
const canvasStyle = computed(() => {
  const k = 1 - flatten.value;
  const x = 25 * k - 16 * cubeLeftT.value * (1 - cubeCenterT.value);
  // F4 baja para alinear con el terminal; en F5 sube de nuevo (estrella más arriba)
  const y = -7 * k + 20 * cubeLeftT.value - 13 * cubeCenterT.value;
  return { transform: `translate(${x}%, ${y}%)` };
});
// banner: sube y se va mientras la placa se acomoda
const contentStyle = computed(() => ({
  transform: `translate(30%, ${-flatten.value * 60}vh)`,
  opacity: 1 - Math.min(flatten.value * 1.4, 1),
}));
// veil: solo hace falta en la fase 1 (texto sobre la izquierda); se desvanece
// con el banner para no opacar el cubo/placa después.
const veilStyle = computed(() => ({ opacity: 1 - flatten.value }));
// título "One core, every database": entra con las bases de datos y se va al retraer
const section2Style = computed(() => ({
  opacity: seg(0.45, 0.5) * (1 - seg(0.54, 0.6)),
}));

// FASE 3 — stats de rendimiento (4 datos a los lados del cubo flotante)
const STATS = [
  { num: "8/9", label: "operations beat Prisma", x: 15, y: 33 },
  { num: "0.73ms", label: "primary-key read", x: 15, y: 66 },
  { num: "5", label: "databases, one API", x: 85, y: 33 },
  { num: "1", label: "round-trip transaction", x: 85, y: 66 },
];
const statsStyle = computed(() => ({ opacity: statsIn.value * (1 - statsOut.value) }));

// FASE 5 — "Powered by Rust" bajo la estrella
const poweredStyle = computed(() => ({ opacity: poweredIn.value }));

// FASE 4 — terminal "See it move" a la derecha (el cubo queda a la izquierda)
const terminalStyle = computed(() => ({
  opacity: terminalIn.value * (1 - terminalOut.value),
  pointerEvents: terminalIn.value > 0.6 && terminalOut.value < 0.3 ? "auto" : "none",
}));

// ── Overlay HTML/SVG de las bases de datos (sobre el canvas, ángulos rectos) ──
const stageEl = ref<HTMLElement | null>(null);
const stageW = ref(1280);
const stageH = ref(720);
let stageRO: ResizeObserver | null = null;
onMounted(() => {
  const el = stageEl.value;
  if (!el) return;
  const measure = () => { stageW.value = el.clientWidth; stageH.value = el.clientHeight; };
  measure();
  stageRO = new ResizeObserver(measure);
  stageRO.observe(el);
});
onBeforeUnmount(() => stageRO?.disconnect());

const DBNET = [
  { logo: "/logos/postgresql.svg", label: "PostgreSQL", hx: -1, hy: -1 },
  { logo: "/logos/mysql.svg", label: "MySQL", hx: 1, hy: -1 },
  { logo: "/logos/mongodb.svg", label: "MongoDB", hx: -1, hy: 1 },
  { logo: "/logos/sqlite.svg", label: "SQLite", hx: 1, hy: 1 },
];
// Conectores en ángulo recto (horizontal → vertical → horizontal) del borde de
// la placa a cada caja; coords en px del stage → líneas rectas y puntos redondos.
const connectors = computed(() => {
  const W = stageW.value, H = stageH.value, bh = 48;
  return DBNET.map((d) => {
    const bx = W * (0.5 + d.hx * 0.3), by = H * (0.5 + d.hy * 0.27); // centro de la caja (más cerca)
    const sx = W * (0.5 + d.hx * 0.1), sy = H * (0.5 + d.hy * 0.14); // arranca en el borde de la placa
    const p1x = W * (0.5 + d.hx * 0.2), p1y = sy; // 1) horizontal
    const p2x = p1x, p2y = by; // 2) vertical
    const p3x = bx - d.hx * bh, p3y = by; // 3) horizontal corto → caja
    const dStr = `M ${sx} ${sy} L ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y}`;
    const len =
      Math.hypot(p1x - sx, p1y - sy) + Math.hypot(p2x - p1x, p2y - p1y) + Math.hypot(p3x - p2x, p3y - p2y);
    return { ...d, bx, by, d: dStr, len };
  });
});
// Tubos: visibles mientras se dibujan y se retraen (la geometría hace el efecto,
// la opacidad solo limpia al final). Cajas/pulsos se ocultan durante la retracción.
const dbnetOpacity = computed(() => dbDrawIn.value * (1 - seg(0.6, 0.63)));
const pulseOpacity = computed(() => seg(0.49, 0.54) * (1 - seg(0.54, 0.57)));
const boxOpacity = computed(() => seg(0.47, 0.53) * (1 - seg(0.54, 0.59)));

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

const compare: { op: string; db: number; prisma: number }[] = [
  { op: "SELECT by primary key", db: 0.73, prisma: 1.01 },
  { op: "UPDATE by primary key", db: 1.41, prisma: 1.82 },
  { op: "Transaction (2 writes)", db: 2.07, prisma: 3.82 },
  { op: "Bulk INSERT 1,000 rows", db: 14.9, prisma: 21.6 },
  { op: "Relation load (50+ orders)", db: 3.28, prisma: 4.55 },
  { op: "100 concurrent lookups", db: 8.05, prisma: 8.04 },
];
// barras relativas al máximo de cada fila (menor = mejor) + chip de aceleración
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
</script>

<template>
  <div class="dbx" :class="{ 'dbx--dark': isDark }">
    <!-- ════════ HERO (track alto; el stage se queda pineado durante el scroll) ════════ -->
    <section ref="heroEl" class="hero">
      <div ref="stageEl" class="hero__stage">
        <div class="hero__canvas" :style="canvasStyle">
          <ClientOnly>
            <BlackHoleCube :progress="progress" />
          </ClientOnly>
        </div>
        <div class="hero__veil" :style="veilStyle" />

        <div class="hero__content" :style="contentStyle">
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
          </div>
        </div>

        <div class="hero__scroll" aria-hidden="true">↓ scroll</div>

        <!-- Overlay HTML/SVG: tubos en ángulo recto + cajas de bases de datos -->
        <div class="dbnet" aria-hidden="true">
          <svg class="dbnet__svg" :viewBox="`0 0 ${stageW} ${stageH}`" preserveAspectRatio="none" :style="{ opacity: dbnetOpacity }">
            <defs>
              <filter id="dbglow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <g filter="url(#dbglow)">
              <path
                v-for="(c, i) in connectors"
                :key="'l' + i"
                :d="c.d"
                fill="none"
                stroke="#7fe0ff"
                stroke-width="2.5"
                stroke-linejoin="round"
                stroke-linecap="round"
                :stroke-dasharray="c.len"
                :stroke-dashoffset="c.len * dashFactor"
              />
            </g>
            <circle v-for="(c, i) in connectors" :key="'p' + i" r="4" fill="#ffffff" :opacity="pulseOpacity">
              <animateMotion :dur="2 + i * 0.35 + 's'" repeatCount="indefinite" :path="c.d" />
            </circle>
          </svg>

          <div
            v-for="(c, i) in connectors"
            :key="'b' + i"
            class="dbnet__box"
            :style="{ left: c.bx + 'px', top: c.by + 'px', opacity: boxOpacity }"
          >
            <img :src="c.logo" :alt="c.label" class="dbnet__logo" />
            <span class="dbnet__label">{{ c.label }}</span>
          </div>
        </div>

        <!-- Título de la sección 2 (placa + bases de datos) -->
        <div class="hero__section2" :style="section2Style">
          <h2 class="s2__title">One core, <span class="hero__grad">every database</span></h2>
          <p class="s2__sub">PostgreSQL, MySQL, MongoDB and SQLite — one fluent API, one Rust engine.</p>
        </div>

        <!-- Sección 3: stats de rendimiento (cubo re-emerge + datos a los lados) -->
        <div class="hero__stats" :style="statsStyle">
          <div class="hero__stats-head">
            <h2 class="s2__title">Benchmarked to <span class="hero__grad">beat Prisma</span></h2>
          </div>
          <div
            v-for="(s, i) in STATS"
            :key="'st' + i"
            class="statcard"
            :style="{ left: s.x + '%', top: s.y + '%' }"
          >
            <div class="statcard__num">{{ s.num }}</div>
            <div class="statcard__lbl">{{ s.label }}</div>
          </div>
        </div>

        <!-- FASE 4: terminal "See it move" a la derecha (el cubo queda a la izquierda) -->
        <div class="hero__playground" :style="terminalStyle">
          <div class="pg__head">
            <h2 class="s2__title">See it <span class="hero__grad">move</span></h2>
            <p class="s2__sub">The same fluent API for reads, writes, transactions and the CLI.</p>
          </div>
          <PlaygroundTerminal />
        </div>

        <!-- FASE 5: el cubo explota en una estrella + "Powered by Rust" -->
        <div class="hero__powered" :style="poweredStyle">
          <h2 class="s2__title">Powered by <span class="hero__grad">Rust</span></h2>
          <p class="s2__sub">Our engine, compiled to the metal — raw, predictable speed under every query.</p>
        </div>
      </div>
    </section>

    <!-- (Los stats viven en la fase 3 del hero; la "See it move" en la fase 4) -->

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
              <span class="bench__name bench__name--db">DBCube</span>
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

/* ── HERO ──
   `.hero` es un TRACK alto: da la distancia de scroll para la animación.
   `.hero__stage` queda pineado (sticky) y ocupa la pantalla mientras el track
   se recorre; el progreso del scroll controla la entrada del cubo al chip. */
.hero {
  position: relative;
  width: 100vw;
  height: 820vh; /* track: 5 fases — cubo→chip, placa+bases, stats, dispersión+terminal, estrella+Rust */
  /* paleta fija oscura, sin importar el tema del resto de la página */
  --bg: #000;
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
/* Título de la sección 2 (placa incrustada + bases de datos) */
.hero__section2 {
  position: absolute; top: 4%; left: 0; right: 0; z-index: 2;
  text-align: center; padding: 0 1.5rem; pointer-events: none;
  text-shadow: 0 2px 24px rgba(4, 5, 7, 0.85);
}
.s2__title { font-size: clamp(1.9rem, 4.5vw, 3.2rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; }
.s2__sub { color: var(--muted); margin-top: 0.2rem; font-size: clamp(0.95rem, 1.6vw, 1.1rem); }

/* Overlay de bases de datos (HTML/SVG sobre el canvas) */
.dbnet { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.dbnet__svg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  filter: drop-shadow(0 0 6px rgba(111, 210, 255, 0.55));
}
.dbnet__box {
  position: absolute; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 0.45rem;
  padding: 0.9rem 1rem 0.7rem;
  border-radius: 16px;
  border: 1.5px solid color-mix(in srgb, var(--cyan) 55%, transparent);
  background: rgba(8, 16, 22, 0.55);
  backdrop-filter: blur(6px);
  box-shadow: 0 0 22px rgba(111, 210, 255, 0.35), inset 0 0 14px rgba(111, 210, 255, 0.12);
  transition: opacity 0.25s ease;
}
.dbnet__logo { width: 52px; height: 52px; object-fit: contain; display: block; }
.dbnet__label { font-size: 0.82rem; font-weight: 600; color: #cfe8f2; letter-spacing: 0.01em; }

/* Sección 3 — stats de rendimiento */
.hero__stats { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.hero__stats-head {
  position: absolute; top: 6%; left: 0; right: 0; text-align: center; padding: 0 1.5rem;
  text-shadow: 0 2px 24px rgba(4, 5, 7, 0.85);
}
.statcard { position: absolute; transform: translate(-50%, -50%); width: clamp(150px, 16vw, 230px); text-align: center; }
.statcard__num {
  font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1;
  background: linear-gradient(120deg, var(--cyan), #3b82f6); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.statcard__lbl { margin-top: 0.45rem; color: #cfe8f2; font-size: clamp(0.82rem, 1.4vw, 0.98rem); }

/* Fase 4 — terminal "See it move" a la derecha */
.hero__playground {
  position: absolute; top: 50%; left: 50%; transform: translateY(-50%);
  width: min(42%, 38rem); z-index: 4;
  display: flex; flex-direction: column; gap: 1rem;
}
.pg__head { text-align: left; }
.pg__head .s2__title { font-size: clamp(1.6rem, 3.5vw, 2.6rem); }
.pg__head .s2__sub { margin-top: 0.3rem; }
@media (max-width: 860px) {
  .hero__playground { position: absolute; left: 5%; right: 5%; width: auto; top: 54%; }
}

/* Fase 5 — "Powered by Rust" bajo la estrella */
.hero__powered {
  position: absolute; top: 52%; left: 0; right: 0; z-index: 4; pointer-events: none;
  text-align: center; padding: 0 1.5rem; text-shadow: 0 2px 24px rgba(4, 5, 7, 0.85);
}

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

/* ── COMPARISON (barras DBCube vs Prisma) ── */
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
.bench__track { height: 0.7rem; background: rgba(255, 255, 255, 0.06); border-radius: 999px; overflow: hidden; }
.bench__fill { height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.bench__fill--db { background: linear-gradient(90deg, var(--cyan), #3b82f6); box-shadow: 0 0 14px color-mix(in srgb, var(--cyan) 45%, transparent); }
.bench__fill--rival { background: rgba(255, 255, 255, 0.22); }
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

/* ── CLOUDS (una connection string + tags de proveedores) ── */
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
/* el CTA final reusa .hero__cta (que va a la izquierda en el hero) → aquí centrado */
.final .hero__cta { justify-content: center; }
.final__title { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em; }
.final__sub { color: var(--muted); margin: 0.8rem 0 1.8rem; font-size: 1.1rem; }
.final__install { margin-bottom: 2rem; font-family: ui-monospace, monospace; }
.final__install code { padding: 0.7rem 1.3rem; border-radius: 8px; border: 1px solid var(--border); background: var(--card); }
</style>
