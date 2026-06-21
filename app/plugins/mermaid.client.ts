// Renders fenced ```mermaid code blocks in the docs as live SVG diagrams.
// Nuxt Content emits them as <pre class="language-mermaid"><code>…</code></pre>;
// this client-only plugin finds those, runs Mermaid, and swaps in the SVG.
// Re-runs on every route change so diagrams appear on client-side navigation.
import { defineNuxtPlugin, useRouter } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  let mermaidPromise: Promise<any> | null = null

  const loadMermaid = () => {
    if (!mermaidPromise) {
      mermaidPromise = import('mermaid').then((m) => {
        const mermaid = m.default ?? m
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose',
          fontFamily: 'inherit',
          themeVariables: {
            primaryColor: '#3B82F6',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#1E40AF',
            lineColor: '#64748B',
            secondaryColor: '#F97316',
            tertiaryColor: '#22C55E',
          },
        })
        return mermaid
      })
    }
    return mermaidPromise
  }

  const render = async () => {
    if (typeof document === 'undefined') return
    const blocks = Array.from(
      document.querySelectorAll('pre.language-mermaid, pre > code.language-mermaid'),
    )
    if (!blocks.length) return

    const mermaid = await loadMermaid()
    let i = 0
    for (const el of blocks) {
      const pre = el.tagName === 'PRE' ? el : el.parentElement
      if (!pre || (pre as HTMLElement).dataset.mermaidDone) continue
      const source = (pre.textContent || '').trim()
      if (!source) continue
      try {
        const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i++}`, source)
        const wrapper = document.createElement('div')
        wrapper.className = 'mermaid-diagram my-6 flex justify-center overflow-x-auto'
        wrapper.innerHTML = svg
        ;(pre as HTMLElement).dataset.mermaidDone = 'true'
        pre.replaceWith(wrapper)
      } catch (e) {
        // Leave the original code block in place if rendering fails.
        console.error('[mermaid] render failed:', e)
      }
    }
  }

  // Prose code blocks (ProsePre) are ASYNC components — they can mount AFTER a
  // single post-navigation scan. So besides scanning on mount/route change, we
  // also watch the DOM for newly-inserted mermaid blocks and render those too.
  let scheduled: ReturnType<typeof setTimeout> | null = null
  const schedule = () => {
    if (scheduled) clearTimeout(scheduled)
    scheduled = setTimeout(() => { render() }, 120)
  }

  const watchDom = () => {
    if (typeof document === 'undefined') return
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.matches?.('pre.language-mermaid') || node.querySelector?.('pre.language-mermaid')) {
            schedule()
            return
          }
        }
      }
    })
    obs.observe(document.body, { childList: true, subtree: true })
  }

  nuxtApp.hook('app:mounted', () => {
    schedule()
    watchDom()
  })
  const router = useRouter()
  router.afterEach(() => schedule())
})
