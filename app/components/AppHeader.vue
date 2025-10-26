<script setup lang="ts">
const appConfig = useAppConfig();

// Logo personalizado
const logoElement = ref<HTMLElement | null>(null);
const isDark = ref(false);
const toast = useToast();
const mobileMenuOpen = ref(false);

// Enlaces de navegación principales
const navLinks = [
  { label: "Showcase", to: "/showcase" },
  { label: "Docs", to: "/docs" },
  { label: "Blog", to: "/blog" },
  { label: "Templates", to: "/templates" },
  { label: "Enterprise", to: "/enterprise" },
];

// Detectar el tema actual
const updateTheme = () => {
  if (process.client) {
    isDark.value = document.documentElement.classList.contains("dark");
  }
};

// Logo según el tema
const logoSrc = computed(() => {
  return isDark.value
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

// Observar cambios de tema
onMounted(() => {
  updateTheme();
  const observer = new MutationObserver(updateTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  onBeforeUnmount(() => observer.disconnect());
});
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full bg-white/80 dark:bg-black backdrop-blur-md border-b border-gray-200 dark:border-gray-600/80"
  >
    <div class="container mx-auto flex h-14 items-center justify-between px-6">
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

        <!-- Botón de tema (Sol/Luna) -->
        <ClientOnly>
          <UColorModeButton size="sm" />
          <template #fallback>
            <div class="h-8 w-8 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-md" />
          </template>
        </ClientOnly>

        <!-- Botón Learn -->
        <UButton color="primary" variant="solid" size="sm" class="hidden md:inline-flex">
          Learn
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
      class="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
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
          <UButton color="primary" variant="solid" size="sm" block>
            Learn
          </UButton>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
