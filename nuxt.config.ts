export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxtjs/plausible', '@nuxtjs/color-mode'],
  css: ['~/assets/css/main.css'],
  // Tema BLOQUEADO en oscuro: el sitio es solo dark, no se puede cambiar.
  // preference fijo a 'dark' e ignoramos la preferencia del sistema.
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
    dataValue: 'dark',
  },
  content: {
    database: undefined,
  },
  site: {
    name: 'Docus',
  },
  compatibilityDate: '2025-07-18',
  llms: {
    domain: 'https://docus.dev',
    title: 'Docus',
    description: 'Write beautiful docs with Markdown.',
    full: {
      title: 'Docus',
      description: 'Write beautiful docs with Markdown.',
    },
  },
})
