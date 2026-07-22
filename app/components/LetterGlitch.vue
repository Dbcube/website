<script setup lang="ts">
/**
 * LetterGlitch — puerto a Vue 3 del componente de React Bits (canvas 2D).
 * Fondo animado de letras que se "glitchean" con transiciones de color suaves.
 * Basado en el mismo algoritmo: grid de caracteres monoespaciados, un % se
 * re-sortea cada `glitchSpeed` ms, y (con `smooth`) el color interpola hacia su
 * objetivo. Sin dependencias.
 */
import { onMounted, onBeforeUnmount, watch, ref } from "vue";

const props = withDefaults(
  defineProps<{
    glitchColors?: string[];
    glitchSpeed?: number;
    centerVignette?: boolean;
    outerVignette?: boolean;
    smooth?: boolean;
    characters?: string;
  }>(),
  {
    glitchColors: () => ["#2b4539", "#61dca3", "#61b3dc"],
    glitchSpeed: 50,
    centerVignette: false,
    outerVignette: true,
    smooth: true,
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789",
  }
);

const canvasRef = ref<HTMLCanvasElement | null>(null);

type Letter = { char: string; color: string; targetColor: string; colorProgress: number };

let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let letters: Letter[] = [];
let grid = { columns: 0, rows: 0 };
let lastGlitchTime = Date.now();
let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

const fontSize = 16;
const charWidth = 10;
const charHeight = 20;

const chars = () => Array.from(props.characters);
const randomChar = () => {
  const a = chars();
  return a[Math.floor(Math.random() * a.length)];
};
const randomColor = () =>
  props.glitchColors[Math.floor(Math.random() * props.glitchColors.length)];

const hexToRgb = (hex: string) => {
  const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthand, (_m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
};

const interpolate = (
  s: { r: number; g: number; b: number },
  e: { r: number; g: number; b: number },
  f: number
) =>
  `rgb(${Math.round(s.r + (e.r - s.r) * f)}, ${Math.round(s.g + (e.g - s.g) * f)}, ${Math.round(
    s.b + (e.b - s.b) * f
  )})`;

const calcGrid = (w: number, h: number) => ({
  columns: Math.ceil(w / charWidth),
  rows: Math.ceil(h / charHeight),
});

const initLetters = (columns: number, rows: number) => {
  grid = { columns, rows };
  letters = Array.from({ length: columns * rows }, () => ({
    char: randomChar(),
    color: randomColor(),
    targetColor: randomColor(),
    colorProgress: 1,
  }));
};

const resizeCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (!parent) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = parent.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const { columns, rows } = calcGrid(rect.width, rect.height);
  initLetters(columns, rows);
  drawLetters();
};

const drawLetters = () => {
  if (!ctx || !canvasRef.value || letters.length === 0) return;
  const { width, height } = canvasRef.value.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = "top";
  for (let i = 0; i < letters.length; i++) {
    const x = (i % grid.columns) * charWidth;
    const y = Math.floor(i / grid.columns) * charHeight;
    ctx.fillStyle = letters[i].color;
    ctx.fillText(letters[i].char, x, y);
  }
};

const updateLetters = () => {
  if (letters.length === 0) return;
  const updateCount = Math.max(1, Math.floor(letters.length * 0.05));
  for (let i = 0; i < updateCount; i++) {
    const idx = Math.floor(Math.random() * letters.length);
    const l = letters[idx];
    if (!l) continue;
    l.char = randomChar();
    l.targetColor = randomColor();
    if (!props.smooth) {
      l.color = l.targetColor;
      l.colorProgress = 1;
    } else {
      l.colorProgress = 0;
    }
  }
};

const handleSmooth = () => {
  let needsRedraw = false;
  for (const l of letters) {
    if (l.colorProgress < 1) {
      l.colorProgress = Math.min(1, l.colorProgress + 0.05);
      const s = hexToRgb(l.color);
      const e = hexToRgb(l.targetColor);
      if (s && e) {
        l.color = interpolate(s, e, l.colorProgress);
        needsRedraw = true;
      }
    }
  }
  if (needsRedraw) drawLetters();
};

const animate = () => {
  const now = Date.now();
  if (now - lastGlitchTime >= props.glitchSpeed) {
    updateLetters();
    drawLetters();
    lastGlitchTime = now;
  }
  if (props.smooth) handleSmooth();
  animationId = requestAnimationFrame(animate);
};

const start = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  resizeCanvas();
  animate();
};

const stop = () => {
  if (animationId != null) cancelAnimationFrame(animationId);
  animationId = null;
};

const onResize = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    stop();
    resizeCanvas();
    animate();
  }, 100);
};

onMounted(() => {
  start();
  window.addEventListener("resize", onResize, { passive: true });
});

onBeforeUnmount(() => {
  stop();
  window.removeEventListener("resize", onResize);
  if (resizeTimeout) clearTimeout(resizeTimeout);
});

// Re-arrancar si cambian los parámetros que afectan el loop.
watch(
  () => [props.glitchSpeed, props.smooth, props.glitchColors, props.characters],
  () => {
    stop();
    resizeCanvas();
    animate();
  }
);
</script>

<template>
  <div class="lg">
    <canvas ref="canvasRef" class="lg__canvas" />
    <div v-if="outerVignette" class="lg__vignette lg__vignette--outer" />
    <div v-if="centerVignette" class="lg__vignette lg__vignette--center" />
  </div>
</template>

<style scoped>
.lg {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
  overflow: hidden;
}
.lg__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.lg__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.lg__vignette--outer {
  background: radial-gradient(circle, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 1) 100%);
}
.lg__vignette--center {
  background: radial-gradient(circle, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 60%);
}
</style>
