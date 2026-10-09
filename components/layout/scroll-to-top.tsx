'use client'

import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { scrollToTop } from '@/lib/smooth-scroll'

/** How far down the page before the button earns its place on screen. */
const SHOW_AFTER = 600

/**
 * The "back to top" button in the bottom-right corner.
 *
 * It is hidden until the visitor is a screen or so down, so it never competes
 * with the hero, and it stacks directly above the WhatsApp button — `bottom-20`
 * clears that 48px button plus its 16px inset, leaving a 16px gap.
 *
 * The jump goes through `scrollToTop`, which hands it to Lenis when momentum
 * scrolling is running and otherwise falls back to the native call — that one
 * omits `behavior` on purpose, so the stylesheet's `scroll-behavior` decides
 * (smooth normally, instant for visitors who ask for reduced motion).
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > SHOW_AFTER
      // Only touch state when the answer actually changes, so scrolling does not
      // re-render on every frame.
      setVisible((current) => (current === next ? current : next))
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      onClick={() => scrollToTop()}
      className={`btn fixed right-4 bottom-20 z-40 inline-flex size-12 items-center justify-center bg-navy text-cream shadow-card transition-all duration-300 hover:bg-navy-soft hover:shadow-card-hover print:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  )
}
