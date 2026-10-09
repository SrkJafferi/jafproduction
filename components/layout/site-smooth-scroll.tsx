'use client'

import Lenis from 'lenis'
import { useEffect, useRef } from 'react'
import 'lenis/dist/lenis.css'
import { setSmoothScroll } from '@/lib/smooth-scroll'

/**
 * Momentum ("inertia") page scrolling, ported from the reference marketing site
 * at marketing.safiz.pk — same library, same tuning.
 *
 * The visitor's wheel is smoothed by Lenis while the page itself still scrolls
 * natively (Lenis writes `behavior: 'instant'` on every frame), so nothing about
 * layout, anchors or the sticky header changes; only the feel does.
 *
 * Two rules shape the wiring:
 *
 * 1. **Reduced motion wins.** Lenis is not created at all when the visitor asks
 *    for reduced motion, and the instance is torn down if they switch the
 *    preference on mid-session. Without that, smoothing would override a
 *    setting the site honours everywhere else.
 * 2. **One instance for the app's lifetime.** This sits in the root layout,
 *    which persists across client-side navigation, so the instance is not
 *    rebuilt per route. `stopInertiaOnNavigate` stops a glide from carrying
 *    into the next page.
 *
 * Lenis already steps aside for nested scroll containers, so the horizontal
 * product carousels keep their own wheel/trackpad behaviour.
 */

/** The reference site's tuning, matched exactly. */
const EASING = (t: number) => 1 - Math.pow(1 - t, 3)

export function SiteSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const stop = () => {
      lenisRef.current?.destroy()
      lenisRef.current = null
      setSmoothScroll(null)
    }

    const start = () => {
      stop()
      if (reduced.matches) return
      const lenis = new Lenis({
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        duration: 0.85,
        easing: EASING,
        anchors: false,
        stopInertiaOnNavigate: true,
      })
      lenisRef.current = lenis
      setSmoothScroll(lenis)
    }

    start()
    reduced.addEventListener('change', start)

    /**
     * In-page anchors are routed through Lenis by hand, because the library's
     * own `anchors` handling only covers bare `#hash` links. This keeps
     * `/#collections` (and friends) gliding with the rest of the page, while
     * leaving modified clicks — new tab, new window, download — to the browser.
     */
    const onClick = (event: MouseEvent) => {
      const lenis = lenisRef.current
      if (!lenis) return
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.hasAttribute('download')) return
      if (anchor.target && anchor.target !== '_self') return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname !== window.location.pathname) return
      if (url.search !== window.location.search) return
      if (!url.hash) return

      let target: HTMLElement | null = null
      try {
        const found = document.querySelector(url.hash)
        target = found instanceof HTMLElement ? found : null
      } catch {
        return
      }
      if (!target) return

      event.preventDefault()
      lenis.scrollTo(target)
      window.history.pushState(null, '', url.hash)
    }

    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      reduced.removeEventListener('change', start)
      stop()
    }
  }, [])

  return null
}
