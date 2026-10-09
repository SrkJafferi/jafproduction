import Link from 'next/link'
import type { ReactNode } from 'react'

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  /**
   * Trailing words of `title` to render in terracotta with the brush swoosh
   * beneath them — the live "WHO WE ARE?" / "Why Choose JAF Trading" treatment.
   * Matched case-insensitively, and the slice from `title` keeps its own casing,
   * so `title="WHO WE ARE?"` + `highlight="are?"` still prints "ARE?".
   * When set, the swoosh sits under the highlighted words instead of the title.
   */
  highlight?: string
  description?: ReactNode
  /** Real link to the full category or collection this section previews. */
  link?: { href: string; label: string }
  align?: 'left' | 'center'
  tone?: 'default' | 'onDark'
  /** The orange brush underline the live headings carry. */
  swoosh?: boolean
  /** Caps the title — the About page's "WHO WE ARE?" block. */
  uppercase?: boolean
}

/**
 * Section titles in the brand's own hierarchy: uppercase small eyebrow, a Jost
 * navy title with the orange brush underline the live storefront uses, and an
 * optional right-aligned "View All" link.
 */
export function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  link,
  align = 'left',
  tone = 'default',
  swoosh = false,
  uppercase = false,
}: SectionHeadingProps) {
  const centered = align === 'center'
  const titleTone = tone === 'onDark' ? 'text-white' : 'text-navy'
  const bodyTone = tone === 'onDark' ? 'text-white/70' : 'text-ink-soft'

  const mark = highlight?.trim() ?? ''
  const trailing = mark.length > 0 && title.toLowerCase().endsWith(mark.toLowerCase())
  const titleBefore = trailing ? title.slice(0, title.length - mark.length).trim() : title
  const titleMark = trailing ? title.slice(title.length - mark.length) : ''

  return (
    <div
      className={`flex flex-col gap-4 ${centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'}`}
    >
      <div className={centered ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2
          className={`mt-2 text-[1.625rem] leading-tight font-medium sm:text-[1.875rem] ${titleTone} ${
            uppercase ? 'uppercase' : ''
          }`}
        >
          {titleMark ? (
            <>
              {titleBefore}
              {titleBefore ? ' ' : null}
              <span className="relative inline-block text-terracotta">
                {titleMark}
                <Swoosh className="pointer-events-none absolute -bottom-2.5 -left-1 h-2.5 w-[calc(100%+0.5rem)]" />
              </span>
            </>
          ) : (
            title
          )}
        </h2>
        {/* With a highlighted phrase the swoosh already sits under it. */}
        {swoosh && !titleMark ? <Swoosh className="mt-2.5 h-2 w-24" centered={centered} tone={tone} /> : null}
        {description ? <p className={`mt-4 text-[0.9375rem] leading-relaxed ${bodyTone}`}>{description}</p> : null}
      </div>

      {link ? (
        <Link
          href={link.href}
          className={`shrink-0 text-xs font-medium tracking-[0.16em] uppercase transition-colors duration-200 ${
            tone === 'onDark' ? 'text-white hover:text-white/70' : 'text-navy hover:text-terracotta'
          }`}
        >
          {link.label}
        </Link>
      ) : null}
    </div>
  )
}

/**
 * The orange brush stroke that sits under the live site's section titles.
 * A tiny inline SVG — no image asset, no runtime cost.
 */
export function Swoosh({ className, centered = false, tone = 'default' }: { className?: string; centered?: boolean; tone?: 'default' | 'onDark' }) {
  return (
    <svg
      viewBox="0 0 120 8"
      fill="none"
      aria-hidden="true"
      className={`${className ?? ''} ${centered ? 'mx-auto' : ''}`}
    >
      <path
        d="M2 6C28 1.5 92 1.5 118 5.5"
        stroke={tone === 'onDark' ? 'var(--color-terracotta)' : 'var(--color-terracotta)'}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
