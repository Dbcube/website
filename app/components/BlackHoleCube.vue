<script setup lang="ts">
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { onMounted, onBeforeUnmount } from "vue";

const canvas = ref<HTMLCanvasElement | null>(null);
let cleanup: (() => void) | null = null;

onMounted(() => {
  try {
  const el = canvas.value;
  if (!el) return;
  const parent = el.parentElement!;
  let disposed = false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sizeOf = () => ({
    w: parent.clientWidth || window.innerWidth,
    h: parent.clientHeight || window.innerHeight,
  });
  let { w, h } = sizeOf();

  // ── Escena, cámara, renderer ──
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
  camera.position.set(10.5, 5, 10.5); // vista isométrica desde arriba
  camera.lookAt(0, 0.2, 0);

  const renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Entorno SOLO para los reflejos metálicos del cubo
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ── Grupo de cubos pequeños (cáscara 4x4x4, hueca) ──
  const cube = new THREE.Group();
  const N = 4;
  const size = 0.9;
  const gap = 0.06;
  const step = size + gap;
  const offset = ((N - 1) * step) / 2;

  const radius = size * 0.0319;
  const smallGeo = new RoundedBoxGeometry(size, size, size, 6, radius);
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x141417,
    metalness: 0.35,
    roughness: 0.62,
    envMap: envTexture,
    envMapIntensity: 0.35,
  });

  const CORE_COLOR = 0x6fd2ff;
  const cubelets: { mesh: THREE.Mesh; home: THREE.Vector3; dir: THREE.Vector3; d: number; v: number }[] = [];

  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      for (let z = 0; z < N; z++) {
        const interior = x > 0 && x < N - 1 && y > 0 && y < N - 1 && z > 0 && z < N - 1;
        if (interior) continue;
        const small = new THREE.Mesh(smallGeo, blackMat);
        small.position.set(x * step - offset, y * step - offset, z * step - offset);
        small.castShadow = true;
        small.receiveShadow = true;
        cube.add(small);
        cubelets.push({
          mesh: small,
          home: small.position.clone(),
          dir: small.position.clone().normalize(),
          d: 0,
          v: 0,
        });
      }
    }
  }

  // Núcleo emisivo detrás de la superficie (asoma por las rendijas)
  const outerHalf = offset + size / 2;
  const coreSize = outerHalf * 2 - 0.12;
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(coreSize, coreSize, coreSize),
    new THREE.MeshBasicMaterial({ color: CORE_COLOR })
  );
  cube.add(core);

  const coreLight = new THREE.PointLight(CORE_COLOR, 2.5, 9, 2);
  cube.add(coreLight);

  cube.scale.setScalar(0.637);
  scene.add(cube);

  // Piso para la sombra
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3.2;
  ground.receiveShadow = true;
  scene.add(ground);

  const BOARD_TOP_Y = -1.35;

  // ── Placa de circuito (GLB comprimido con Draco + texturas WebP) ──
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/"); // decoder servido localmente desde public/draco
  loader.setDRACOLoader(draco);
  loader.load(
    "/circuit-board.glb",
    (gltf) => {
      if (disposed) return;
      const board = gltf.scene;
      board.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: any) => {
            if (!m) return;
            m.metalnessMap = null;
            m.roughnessMap = null;
            m.metalness = 0.0;
            m.roughness = 0.9;
            m.envMap = null;
            m.envMapIntensity = 0.0;
            if (m.normalMap) m.normalScale.set(0.25, 0.25);
            m.color.multiplyScalar(0.48);
            if (m.map && m.map.image) {
              const img = m.map.image;
              const cw = img.width || 1024, ch = img.height || 1024;
              const cv = document.createElement("canvas");
              cv.width = cw; cv.height = ch;
              const cx = cv.getContext("2d")!;
              cx.drawImage(img, 0, 0, cw, ch);
              const id = cx.getImageData(0, 0, cw, ch);
              const px = id.data;
              for (let k = 0; k < px.length; k += 4) {
                const lum = (px[k] + px[k + 1] + px[k + 2]) / 3;
                if (lum < 95) {
                  px[k] = px[k + 1] = px[k + 2] = 0;
                } else {
                  const g = Math.min(255, (lum - 95) * 2.2);
                  px[k] = px[k + 1] = px[k + 2] = g;
                }
              }
              cx.putImageData(id, 0, 0);
              const emTex = new THREE.CanvasTexture(cv);
              emTex.flipY = m.map.flipY;
              emTex.wrapS = m.map.wrapS;
              emTex.wrapT = m.map.wrapT;
              emTex.repeat.copy(m.map.repeat);
              emTex.offset.copy(m.map.offset);
              emTex.colorSpace = THREE.SRGBColorSpace;
              m.emissiveMap = emTex;
              m.emissive = new THREE.Color(0x6fd2ff);
              m.emissiveIntensity = 1.2;
            }
            m.needsUpdate = true;
          });
        }
      });

      let box = new THREE.Box3().setFromObject(board);
      let s = box.getSize(new THREE.Vector3());
      if (s.x <= s.y && s.x <= s.z) {
        board.rotation.z = Math.PI / 2;
      } else if (s.z <= s.x && s.z <= s.y) {
        board.rotation.x = -Math.PI / 2;
      }

      board.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(board);
      s = box.getSize(new THREE.Vector3());
      const targetWidth = 7;
      const scale = targetWidth / Math.max(s.x, s.z);
      board.scale.setScalar(scale);

      board.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(board);
      const c = box.getCenter(new THREE.Vector3());
      board.position.x -= c.x;
      board.position.z -= c.z;
      board.position.y += BOARD_TOP_Y - box.max.y;

      scene.add(board);
      box = new THREE.Box3().setFromObject(board);
      ground.position.y = box.min.y - 0.01;
    },
    undefined,
    (err) => console.error("Error al cargar el GLB:", err)
  );

  // ── Luces ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.1));
  scene.add(new THREE.HemisphereLight(0x6f8fcf, 0x080a10, 0.18));

  const key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(5, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.12);
  fill.position.set(-6, 3, -4);
  scene.add(fill);

  const topLight = new THREE.DirectionalLight(0xcfe0ff, 1.6);
  topLight.position.set(0, 12, 0);
  topLight.target.position.set(0, BOARD_TOP_Y, 0);
  scene.add(topLight);
  scene.add(topLight.target);

  const centerLight = new THREE.PointLight(0xbfd4ff, 2.4, 6, 2.2);
  centerLight.position.set(0, BOARD_TOP_Y + 1.2, 0);
  scene.add(centerLight);

  // ── Ambiente tipo render ──
  const GLOW = 0x6fd2ff;
  const SCALE = 0.637;
  const HOVER = 1.4;
  const cubeBottom = () => cube.position.y - outerHalf * SCALE;

  scene.fog = new THREE.FogExp2(0x000000, 0.012);

  // Cables tipo puente (chip -> base del cubo)
  const foot = outerHalf * SCALE * 0.8;
  const chipR = foot * 0.35;
  const cableRadius = 0.0204;

  const bridgeConns = [
    { chip: [chipR * 0.6, chipR * 0.5], cube: [foot * 1.15, foot * 0.25] },
    { chip: [-chipR * 0.6, -chipR * 0.4], cube: [-foot * 1.15, -foot * 0.3] },
    { chip: [chipR * 0.7, -chipR * 0.5], cube: [foot * 1.05, -foot * 0.55] },
    { chip: [-chipR * 0.5, chipR * 0.6], cube: [-foot * 0.95, foot * 0.65] },
    { chip: [chipR * 0.1, chipR * 0.7], cube: [foot * 0.35, foot * 1.1] },
    { chip: [-chipR * 0.2, -chipR * 0.7], cube: [-foot * 0.3, -foot * 1.1] },
    { chip: [chipR * 0.5, chipR * 0.05], cube: [foot * 1.15, -foot * 0.05] },
    { chip: [-chipR * 0.55, chipR * 0.1], cube: [-foot * 1.1, foot * 0.1] },
  ];
  const bridgeMat = new THREE.MeshBasicMaterial({ color: GLOW, transparent: true, opacity: 0.8 });
  const bridges = bridgeConns.map(() => {
    const m = new THREE.Mesh(new THREE.BufferGeometry(), bridgeMat);
    scene.add(m);
    return m;
  });
  const bridgeCurves: THREE.CatmullRomCurve3[] = new Array(bridgeConns.length);

  // Pulsos de datos
  const pulseGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  pulseMat.toneMapped = false;
  const pulses: { mesh: THREE.Mesh; bridge: number; t: number; dir: number; speed: number }[] = [];
  for (let i = 0; i < bridgeConns.length; i++) {
    const n = 1 + (i % 2);
    for (let k = 0; k < n; k++) {
      const mesh = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(mesh);
      pulses.push({ mesh, bridge: i, t: Math.random(), dir: Math.random() < 0.5 ? 1 : -1, speed: 0.35 + Math.random() * 0.4 });
    }
  }

  function updateBridges(topY: number) {
    const bottomY = BOARD_TOP_Y + 0.01;
    for (let i = 0; i < bridges.length; i++) {
      const c = bridgeConns[i];
      const stepY = bottomY + (topY - bottomY) * (0.4 + (i % 3) * 0.12);
      const pts = [
        new THREE.Vector3(c.chip[0], bottomY, c.chip[1]),
        new THREE.Vector3(c.chip[0], stepY, c.chip[1]),
        new THREE.Vector3(c.cube[0], stepY, c.cube[1]),
        new THREE.Vector3(c.cube[0], topY, c.cube[1]),
      ];
      const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4);
      bridgeCurves[i] = curve;
      const geo = new THREE.TubeGeometry(curve, 50, cableRadius, 8, false);
      bridges[i].geometry.dispose();
      bridges[i].geometry = geo;
    }
  }

  // Puntos de impacto en el chip
  const dotGeo = new THREE.SphereGeometry(0.03, 10, 10);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xeaf6ff });
  for (const c of bridgeConns) {
    const d = new THREE.Mesh(dotGeo, dotMat);
    d.position.set(c.chip[0], BOARD_TOP_Y + 0.02, c.chip[1]);
    scene.add(d);
  }

  // ── Post-procesado: bloom ──
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.28, 0.32);
  composer.addPass(bloom);
  composer.setSize(w, h);

  // ── Animación ──
  const clock = new THREE.Clock();
  let elapsed = 0;
  const STIFFNESS = 55;
  const DAMPING = 0.9;
  const KICK_CHANCE = 0.01;
  const KICK_FORCE = 1.8;
  const MAX_OUT = 0.45;

  let raf = 0;
  function animate() {
    raf = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    cube.position.y = HOVER + Math.sin(elapsed * 1.2) * 0.12;

    updateBridges(cubeBottom());

    for (const pl of pulses) {
      const curve = bridgeCurves[pl.bridge];
      if (!curve) continue;
      pl.t += pl.dir * pl.speed * dt;
      if (pl.t > 1) pl.t = 0;
      else if (pl.t < 0) pl.t = 1;
      curve.getPoint(pl.t, pl.mesh.position);
    }

    for (const c of cubelets) {
      if (Math.random() < KICK_CHANCE) c.v += KICK_FORCE * (0.5 + Math.random() * 0.5);
      c.v += (0 - c.d) * STIFFNESS * dt;
      c.v *= DAMPING;
      c.d += c.v * dt;
      if (c.d < 0) { c.d = 0; c.v = 0; }
      if (c.d > MAX_OUT) { c.d = MAX_OUT; c.v = 0; }
      c.mesh.position.copy(c.home).addScaledVector(c.dir, c.d);
    }

    composer.render();
  }
  animate();
  if (reduce) cancelAnimationFrame(raf); // escena estática si se pide menos movimiento

  // ── Responsive ──
  const onResize = () => {
    const next = sizeOf();
    w = next.w; h = next.h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);
  const ro = new ResizeObserver(() => onResize());
  ro.observe(parent);

  cleanup = () => {
    disposed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("resize", onResize);
    smallGeo.dispose();
    pmrem.dispose();
    composer.dispose();
    draco.dispose();
    renderer.dispose();
  };
  } catch (e) {
    console.error("[BlackHoleCube] init failed:", e);
  }
});

onBeforeUnmount(() => cleanup?.());
</script>

<template>
  <canvas ref="canvas" class="dbx-canvas" aria-hidden="true" />
</template>

<style scoped>
/* No usar la clase `block` de Tailwind: choca con la regla `.block` de Docus
   (max-width:72rem + margin auto + padding) que encajonaba el canvas. */
.dbx-canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}
</style>
