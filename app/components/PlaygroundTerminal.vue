<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from "vue";

type Demo = {
  id: string;
  label: string;
  prompt: string;
  code: string;
  output: string[];
};

// Demos curados — código real de DBCube y una salida representativa (mock,
// no se conecta a ninguna base de datos).
const demos: Demo[] = [
  {
    id: "read",
    label: "Read",
    prompt: "app.ts",
    code: `const users = await db.table('users')
  .where('status', '=', 'active')
  .orderBy('age', 'DESC')
  .limit(3)
  .get();`,
    output: [
      "→ 3 rows in 0.7ms",
      "[",
      "  { id: 7,  name: 'Ada Lovelace',   age: 36 },",
      "  { id: 2,  name: 'Linus Torvalds', age: 54 },",
      "  { id: 11, name: 'Grace Hopper',   age: 85 },",
      "]",
    ],
  },
  {
    id: "write",
    label: "Write",
    prompt: "app.ts",
    code: `const created = await db.table('users').insert([
  { name: 'Margaret Hamilton', email: 'mh@nasa.gov', age: 32 },
]);`,
    output: [
      "→ inserted in 1.4ms",
      "[ { id: 42, name: 'Margaret Hamilton', age: 32 } ]",
    ],
  },
  {
    id: "tx",
    label: "Transaction",
    prompt: "app.ts",
    code: `await db.batch((b) => {
  b.table('users').where('id', '=', 1).decrement('balance', 200);
  b.table('users').where('id', '=', 2).increment('balance', 200);
});`,
    output: [
      "→ committed in 2.1ms  (one round-trip)",
      "✓ balances transferred atomically",
    ],
  },
  {
    id: "cli",
    label: "CLI",
    prompt: "~/my-app",
    code: `npx dbcube run table:fresh
npx dbcube generate`,
    output: [
      "🧊 EXECUTING FRESH TABLES",
      "├─ users ............... ✓ OK",
      "├─ orders .............. ✓ OK",
      "✓ types written to dbcube/types.ts",
    ],
  },
];

const active = ref(0);
const typed = ref("");
const showOutput = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

const current = computed(() => demos[active.value]);

// Resaltador ligero (regex de UNA pasada) para JS y comandos CLI. Funciona con la
// animación de tipeo: tokens a medio escribir quedan en color base hasta cerrarse.
const TOKEN_RE =
  /(\/\/[^\n]*)|((['"`])(?:\\.|(?!\3)[^\\])*\3)|(\b(?:npx|npm|dbcube|run|generate|fresh)\b)|(\b(?:const|let|var|await|async|function|return|new|import|export|from|if|else|for|of|in|true|false|null|undefined)\b)|(\.[a-zA-Z_]\w*(?=\s*\())|(\b[a-zA-Z_]\w*(?=\s*:))|(\b\d+(?:\.\d+)?\b)/g;

function highlightCode(src: string): string {
  if (!src) return "";
  const esc = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(TOKEN_RE, (m, com, str, _q, cli, kw, fn, prop, num) => {
    if (com) return `<span class="t-com">${com}</span>`;
    if (str) return `<span class="t-str">${str}</span>`;
    if (cli) return `<span class="t-cli">${cli}</span>`;
    if (kw) return `<span class="t-kw">${kw}</span>`;
    if (fn) return `.<span class="t-fn">${fn.slice(1)}</span>`;
    if (prop) return `<span class="t-prop">${prop}</span>`;
    if (num) return `<span class="t-num">${num}</span>`;
    return m;
  });
}

const highlightedCode = computed(() => highlightCode(typed.value));

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function run(i: number) {
  active.value = i;
  typed.value = "";
  showOutput.value = false;
  clearTimer();

  const code = demos[i].code;
  let pos = 0;
  const step = () => {
    // escribe en pequeños saltos para que se sienta fluido y rápido
    pos = Math.min(code.length, pos + Math.max(1, Math.round(Math.random() * 3)));
    typed.value = code.slice(0, pos);
    if (pos < code.length) {
      timer = setTimeout(step, 16);
    } else {
      timer = setTimeout(() => (showOutput.value = true), 250);
    }
  };
  step();
}

// arranca la primera demo al montar (solo cliente)
onMounted(() => run(0));

onBeforeUnmount(clearTimer);
</script>

<template>
  <div class="ph-term">
    <!-- barra de pestañas -->
    <div class="ph-tabs">
      <div class="ph-dots" aria-hidden="true">
        <span /><span /><span />
      </div>
      <button
        v-for="(d, i) in demos"
        :key="d.id"
        class="ph-tab"
        :class="{ 'ph-tab--on': i === active }"
        @click="run(i)"
      >
        {{ d.label }}
      </button>
      <span class="ph-file">{{ current.prompt }}</span>
    </div>

    <!-- código (typing con resaltado) -->
    <pre class="ph-code"><span class="ph-gutter">$</span><code><span v-html="highlightedCode" /><span class="ph-caret" /></code></pre>

    <!-- salida -->
    <transition name="ph-fade">
      <div v-if="showOutput" class="ph-out">
        <p v-for="(line, idx) in current.output" :key="idx" class="ph-line">{{ line }}</p>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.ph-term {
  border-radius: 14px;
  overflow: hidden;
  background: #0a0e14;
  border: 1px solid rgba(34, 211, 238, 0.18);
  box-shadow: 0 0 60px -15px rgba(34, 211, 238, 0.35), 0 20px 50px -20px rgba(0, 0, 0, 0.8);
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  text-align: left; /* no heredar el center del hero en móvil */
}
.ph-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: #070a0f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.ph-dots {
  display: flex;
  gap: 6px;
  margin-right: 10px;
}
.ph-dots span {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #2a2f37;
}
.ph-dots span:nth-child(1) { background: #ff5f57; }
.ph-dots span:nth-child(2) { background: #febc2e; }
.ph-dots span:nth-child(3) { background: #28c840; }
.ph-tab {
  font-size: 12px;
  color: #7d8590;
  padding: 4px 12px;
  border-radius: 7px;
  transition: all 0.15s;
  cursor: pointer;
}
.ph-tab:hover { color: #cdd9e5; }
.ph-tab--on {
  color: #0a0e14;
  background: #22d3ee;
  font-weight: 600;
}
.ph-file {
  margin-left: auto;
  font-size: 11px;
  color: #4b5563;
}
.ph-code {
  margin: 0;
  padding: 20px 18px;
  min-height: 130px;
  font-size: 13.5px;
  line-height: 1.7;
  color: #d6dee8;
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
}
.ph-code code { display: inline; }
.ph-gutter {
  color: #22d3ee;
  margin-right: 10px;
  user-select: none;
}
.ph-caret {
  display: inline-block;
  width: 7px;
  height: 1.05em;
  background: #22d3ee;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ph-blink 1s steps(2) infinite;
}
@keyframes ph-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }

/* paleta de sintaxis (estilo GitHub dark, cohesiva con el cian del sitio) */
.ph-code :deep(.t-kw) { color: #ff7b72; }
.ph-code :deep(.t-str) { color: #a5d6ff; }
.ph-code :deep(.t-fn) { color: #d2a8ff; }
.ph-code :deep(.t-num) { color: #79c0ff; }
.ph-code :deep(.t-prop) { color: #79c0ff; }
.ph-code :deep(.t-com) { color: #8b949e; font-style: italic; }
.ph-code :deep(.t-cli) { color: #7ee787; font-weight: 600; }

.ph-out {
  padding: 14px 18px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: #060a0f;
  font-size: 12.5px;
  line-height: 1.65;
  text-align: left;
}
.ph-line {
  margin: 0;
  color: #6ee7b7;
  white-space: pre-wrap;
}
.ph-line:first-child { color: #22d3ee; font-weight: 600; }
.ph-fade-enter-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.ph-fade-enter-from { opacity: 0; transform: translateY(6px); }
</style>
