<script setup lang="ts">
const appConfig = useAppConfig();
const colorMode = useColorMode();
const toast = useToast();

// Logo personalizado
const logoElement = ref<HTMLElement | null>(null);
const mobileMenuOpen = ref(false);

// Enlaces de navegación principales (rutas reales de la documentación)
const navLinks = [
  { label: "Docs", to: "/getting-started/introduction" },
  { label: "Performance", to: "/performance/overview" },
  { label: "Examples", to: "/examples/overview" },
  { label: "CLI", to: "/cli/overview" },
];

// Logo según el tema (reactivo e instantáneo)
const logoSrc = computed(() => {
  return colorMode.value === "dark"
    ? "https://pub-d1faa8ef561c493db89f6133874bc143.r2.dev/DBLOGO-WHITE-LARGE.webp"
    : "https://pub-d1faa8ef561c493db89f6133874bc143.r2.dev/DBLOGO-BLACK-LARGE.webp";
});

// Copiar el logo
const copyLogo = async () => {
  if (!logoElement.value) return;
  try {
    await navigator.clipboard.writeText(logoElement.value.outerHTML);
    toast.add({
      title: "Logo copiado",
      description: "Imagen copiada al portapapeles",
      icon: "i-lucide-circle-check",
      color: "success",
    });
  } catch {
    toast.add({
      title: "Error al copiar",
      description: "No se pudo copiar el logo",
      icon: "i-lucide-circle-x",
      color: "error",
    });
  }
};

// Descargar el logo
const downloadLogo = () => {
  if (!logoElement.value) return;
  const svgData = logoElement.value.outerHTML;
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: "logo.svg",
  });
  link.click();
  URL.revokeObjectURL(url);
  toast.add({
    title: "Logo descargado",
    description: "El archivo se ha guardado",
    icon: "i-lucide-download",
    color: "success",
  });
};

// Menú contextual del logo
const logoContextMenuItems = [
  [{ label: "Copiar Logo", icon: "i-lucide-copy", onSelect: copyLogo }],
  [
    {
      label: "Descargar Logo",
      icon: "i-lucide-download",
      onSelect: downloadLogo,
    },
  ],
];

// Header flotante (isla) arriba → barra completa al hacer scroll.
const scrolled = ref(false);
let onScroll: (() => void) | null = null;
onMounted(() => {
  onScroll = () => { scrolled.value = window.scrollY > 24; };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => {
  if (onScroll) window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <header class="sticky top-0 z-50 w-full h-16">
    <!-- Isla flotante arriba; al hacer scroll se expande a barra completa -->
    <div
      class="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-between gap-4 backdrop-blur-xl transition-all duration-300 ease-out"
      :class="scrolled
        ? 'top-0 h-16 w-full rounded-none border-b border-gray-200 dark:border-white/10 bg-white/75 dark:bg-black/70 px-6'
        : 'top-3 h-12 w-[min(64rem,calc(100%-2rem))] rounded-2xl border border-gray-200 dark:border-white/10 bg-white/85 dark:bg-black/55 px-5 shadow-xl shadow-black/40'"
    >
      <!-- Logo + Navegación (izquierda) -->
      <div class="flex items-center gap-8">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <UContextMenu :items="logoContextMenuItems">
            <img
              ref="logoElement"
              :src="logoSrc"
              alt="Logo"
              class="h-6 w-auto cursor-pointer select-none"
            />
          </UContextMenu>
        </NuxtLink>

        <!-- Navegación Desktop -->
        <nav class="hidden md:flex items-center gap-6">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Botones (derecha) -->
      <div class="flex items-center gap-2">
        <!-- Buscador (icono) -->
        <UContentSearchButton />

        <!-- GitHub -->
        <UButton
          to="https://github.com/Dbcube"
          target="_blank"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-simple-icons-github"
          class="hidden md:inline-flex"
        />

        <!-- CTA principal -->
        <UButton
          to="/getting-started/installation"
          color="primary"
          variant="solid"
          size="sm"
          class="hidden md:inline-flex font-semibold"
        >
          Get started
        </UButton>

        <!-- Menú hamburguesa (móvil) -->
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          square
          class="md:hidden"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <UIcon
            :name="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
            class="size-5"
          />
        </UButton>
      </div>
    </div>

    <!-- Menú móvil -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden absolute top-16 inset-x-0 z-10 border-y border-gray-200 dark:border-white/10 bg-white dark:bg-black/95 backdrop-blur-xl"
    >
      <nav class="container mx-auto flex flex-col px-6 py-4 gap-3">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors py-2"
          @click="mobileMenuOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
        <div class="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
          <UButton to="/getting-started/installation" color="primary" variant="solid" size="sm" block>
            Get started
          </UButton>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
