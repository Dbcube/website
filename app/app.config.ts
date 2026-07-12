export default defineAppConfig({
  // Tema bloqueado en oscuro: en Docus un `colorMode` con valor NO vacío se
  // considera "forzado", lo que oculta el UColorModeButton (toggle dark/light)
  // tanto del header como del footer. Coincide con el plugin force-dark.
  docus: {
    colorMode: 'dark',
  },
  socials: {
    x: 'https://x.com/dbcubeorm',
  },
  github: {
    rootDir: 'docs',
  },
  toc: {
    bottom: {
      links: [{
        icon: 'i-lucide-book-open',
        label: 'Nuxt UI docs',
        to: 'https://ui.nuxt.com/getting-started/installation/nuxt',
        target: '_blank',
      }],
    },
  },
  ui: {
    pageHero: {
      slots: {
        title: 'font-semibold sm:text-6xl',
        container: '!pb-0',
      },
    },
    pageCard: {
      slots: {
        container: 'lg:flex min-w-0',
        wrapper: 'flex-none',
      },
    },
  },
})
