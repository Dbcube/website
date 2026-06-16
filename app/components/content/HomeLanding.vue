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

// Fase 2 del scroll (coincide con PHASE1 del componente 3D = 0.45), subdividida:
//  settle (0→0.5): la placa se ACOMODA (cenital), el banner se va, el canvas centra.
//  reveal (0.5→1): aparecen tubos/iconos y, ya acomodada, el TÍTULO de sección.
const PHASE1 = 0.45;
const phase2 = computed(() => Math.max((progress.value - PHASE1) / (1 - PHASE1), 0));
const settle = computed(() => Math.min(phase2.value / 0.5, 1));
const reveal = computed(() => Math.max((phase2.value - 0.5) / 0.5, 0));
// canvas: de translate(25%,-7%) → (0,0) (se centra mientras se acomoda)
const canvasStyle = computed(() => {
  const k = 1 - settle.value;
  return { transform: `translate(${25 * k}%, ${-7 * k}%)` };
});
// banner: "continúa su recorrido" (sube y se va) mientras la placa se acomoda
const contentStyle = computed(() => ({
  transform: `translate(30%, ${-settle.value * 60}vh)`,
  opacity: 1 - Math.min(settle.value * 1.4, 1),
}));
// título de la sección 2: aparece SOLO después de que la placa ya se acomodó
const section2Style = computed(() => ({
  opacity: Math.min(Math.max((reveal.value - 0.15) / 0.5, 0), 1),
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
// Los tubos/cajas se RETRASAN hasta que la placa ya está bien acomodada
// (la placa termina de encoger ~reveal 0.4; los tubos arrancan después).
const drawT = computed(() => Math.min(Math.max((reveal.value - 0.45) / 0.45, 0), 1)); // dibujado de los tubos
const dbnetOpacity = computed(() => Math.min(Math.max((reveal.value - 0.45) / 0.25, 0), 1));
const pulseOpacity = computed(() => Math.min(Math.max((reveal.value - 0.7) / 0.25, 0), 1));
const boxOpacity = computed(() => Math.min(Math.max((reveal.value - 0.62) / 0.3, 0), 1));

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
      <div ref="stageEl" class="hero__stage">
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
                :stroke-dashoffset="c.len * (1 - drawT)"
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
  height: 400vh; /* track: cubo→chip, placa se acomoda/encoge, y aparición escalonada de tubos+logos */
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
/* el CTA final reusa .hero__cta (que va a la izquierda en el hero) → aquí centrado */
.final .hero__cta { justify-content: center; }
.final__title { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em; }
.final__sub { color: var(--muted); margin: 0.8rem 0 1.8rem; font-size: 1.1rem; }
.final__install { margin-bottom: 2rem; font-family: ui-monospace, monospace; }
.final__install code { padding: 0.7rem 1.3rem; border-radius: 8px; border: 1px solid var(--border); background: var(--card); }
</style>
