import type { ReactNode } from 'react'

type BadgeTone = 'sale' | 'featured' | 'ask' | 'neutral' | 'onDark'

const tones: Record<BadgeTone, string> = {
  sale: 'bg-sale text-white',
  featured: 'bg-featured text-white',
  ask: 'bg-navy text-white',
  neutral: 'border border-border bg-surface text-muted',
  onDark: 'border border-white/30 bg-white/10 text-white',
}

/**
 * Status chips on product cards, matching the live store: the pink FEATURED
 * pill, the green discount pill, and a plain chip for the ask-for-price state.
 */
export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.12em] uppercase ${tones[tone]} ${className ?? ''}`}
    >
      {children}
    </span>
  )
}
