import type Lenis from 'lenis'

/**
 * A module-level handle on the live Lenis instance.
 *
 * Lenis is created in one place — `SiteSmoothScroll` in the root layout — but
 * other components need to drive it (the back-to-top button, in-page anchors).
 * A tiny registry is enough for that: it keeps the instance out of React state,
 * so reading it never triggers a re-render, and it survives the client-side
 * navigations that swap the page underneath the persistent layout.
 */
let instance: Lenis | null = null

export function setSmoothScroll(next: Lenis | null) {
  instance = next
}

export function getSmoothScroll() {
  return instance
}

/**
 * Scrolls back to the top of the page.
 *
 * When Lenis is running the motion is handed to it, so the glide matches the
 * rest of the page. Otherwise it falls back to the native call, which
 * deliberately omits `behavior`: the spec then falls back to the scrolling
 * element's own `scroll-behavior` — `smooth` from the stylesheet, and `auto`
 * for visitors who ask for reduced motion.
 */
export function scrollToTop() {
  if (instance) instance.scrollTo(0)
  else window.scrollTo({ top: 0 })
}
