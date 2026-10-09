'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ProductCard } from '@/components/catalogue/product-card'
import { Swoosh } from '@/components/home/section-heading'
import type { Product } from '@/types/catalogue'

type PromoImage = {
  src: string
  width: number
  height: number
  alt: string
  /**
   * Optional overrides for the `<img>`. `fill` fixes position, width and height
   * (Next throws if those are passed here), but `left`, `maxWidth` and
   * `objectFit` are free: Next merges this object last, so it beats the fill
   * defaults rather than losing to them.
   */
  style?: CSSProperties
}

type FeaturedShowcaseProps = {
  products: Product[]
  promo?: PromoImage
  /** Which side the promo photograph sits on for collection showcases. */
  promoSide?: 'left' | 'right'
  collection?: {
    /** Centered heading shown above the grid — the collection blocks. */
    heading?: string
    body?: string
    /** The "For Bed" / "For Bath" label that leads the carousel column. */
    anchor?: string
    /** The leading words shown in orange with the brush underline. */
    highlight?: string
    /**
     * `stacked` (default) — the collection blocks: a centered heading and body
     * sit above a promo-photograph + carousel grid.
     * `inline` — the "For Bath" band: no centered header; the anchor label
     * leads the carousel column, left-aligned, with a rule running to the right.
     */
    headerLayout?: 'stacked' | 'inline'
    /**
     * How the anchor label sits above the carousel. Defaults to `right` for the
     * collection blocks; `inline` always uses `left`. Set it explicitly to give
     * a stacked block the left-aligned, ruled treatment without dropping its
     * centered heading — the "For Hair" block.
     */
    anchorLayout?: 'left' | 'right'
  }
  /**
   * Copy for the plain carousel band. The homepage Featured block omits it and
   * gets the default "Our Top Picks / Featured" treatment; the product page
   * passes just a title, which also renders at a smaller size — there the band
   * is a sub-section, not the page's opening statement.
   */
  heading?: {
    title: string
    eyebrow?: string
    description?: string
  }
  /** Section background. Defaults to white for collections, cream for Featured. */
  background?: 'cream' | 'white'
  /** Extra classes on the section, e.g. the product page's top rule. */
  className?: string
  /**
   * Cards visible at once on a wide screen. The homepage bands show three; the
   * product page's "Recommended products" rail asks for four. A shorter list
   * widens its cards to fill the row rather than leaving half of it empty.
   */
  perView?: 3 | 4
}

/**
 * Featured and collection showcases share a native scroll-snap carousel that
 * advances one card per step. Collections use a centered heading and place
 * their promo photograph to the right of the products.
 *
 * The autoplay timer only scrolls the track (no state is set inside effects);
 * the active dot is derived in the scroll handler. Cloned lead cards make the
 * wrap at the end land on a frame identical to the start, so the loop reads as
 * seamless. Autoplay pauses on hover/focus and is skipped for visitors who
 * prefer reduced motion.
 */

const AUTOPLAY_MS = 3800

/**
 * One card's width per rail density. The track's gap is `gap-3` (12px), so an
 * N-up rail leaves N-1 gaps: `(100% - 12px * (N - 1)) / N`. These are written
 * out rather than interpolated because Tailwind only emits classes it can see
 * literally in the source.
 */
const THREE_UP = 'w-[86%] flex-none snap-start sm:w-[calc(50%-6px)] lg:w-[calc((100%-24px)/3)]'
const RAIL_WIDTH: Record<number, string> = {
  1: 'w-[86%] flex-none snap-start lg:w-full',
  2: 'w-[86%] flex-none snap-start sm:w-[calc(50%-6px)] lg:w-[calc((100%-12px)/2)]',
  3: THREE_UP,
  4: 'w-[86%] flex-none snap-start sm:w-[calc(50%-6px)] md:w-[calc((100%-24px)/3)] lg:w-[calc((100%-36px)/4)]',
}

/** One card's scroll step: gap included, measured off the real layout. */
function stepOf(track: HTMLElement): number {
  if (track.children.length < 2) return track.clientWidth
  const first = track.children[0] as HTMLElement
  const second = track.children[1] as HTMLElement
  return second.offsetLeft - first.offsetLeft
}

/** Advance one card, wrapping seamlessly to the start at the end. */
function advanceTrack(track: HTMLElement | null) {
  if (!track) return
  const maxScroll = track.scrollWidth - track.clientWidth
  if (track.scrollLeft >= maxScroll - 4) {
    track.scrollTo({ left: 0, behavior: 'smooth' })
  } else {
    track.scrollBy({ left: stepOf(track), behavior: 'smooth' })
  }
}

function rewindTrack(track: HTMLElement | null) {
  if (!track) return
  if (track.scrollLeft <= 4) {
    track.scrollTo({ left: track.scrollWidth - track.clientWidth, behavior: 'smooth' })
  } else {
    track.scrollBy({ left: -stepOf(track), behavior: 'smooth' })
  }
}

export function FeaturedShowcase({
  products,
  promo,
  promoSide = 'right',
  collection,
  heading,
  background,
  className,
  perView = 3,
}: FeaturedShowcaseProps) {
  const trackRef = useRef<HTMLUListElement>(null)
  const pausedRef = useRef(false)
  const [active, setActive] = useState(0)

  // Autoplay: the interval only scrolls the track; pausing is a ref flag, so
  // no state is ever set inside the effect.
  useEffect(() => {
    if (products.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      if (!pausedRef.current) advanceTrack(trackRef.current)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [products.length])

  const handleScroll = () => {
    const track = trackRef.current
    if (!track) return
    setActive(Math.round(track.scrollLeft / stepOf(track)) % products.length)
  }

  // How many cards sit in view on a wide screen, capped at what the list holds
  // so a short rail widens its cards instead of leaving half a row empty.
  const railCount = Math.max(1, Math.min(perView, products.length))
  const cardWidth = RAIL_WIDTH[railCount] ?? THREE_UP
  // Clone exactly as many lead cards as are visible at once. That is what makes
  // the wrap land on a frame identical to the start, so the loop reads as
  // seamless rather than snapping back.
  const cloneCount = railCount
  const cards = products.length > 0 ? [...products, ...products.slice(0, cloneCount)] : []
  // The orange, underlined words — leading ("Bedding Collection") or
  // trailing ("Hair Wrap Turban") in the heading, whichever matches.
  const highlight = collection?.highlight?.trim() ?? ''
  const collectionHeading = collection?.heading ?? ''
  const highlightFirst = collectionHeading.startsWith(highlight)
  const headingBefore =
    highlightFirst || !highlight ? '' : collectionHeading.slice(0, collectionHeading.length - highlight.length).trim()
  const headingAfter = highlightFirst ? collectionHeading.slice(highlight.length).trim() : ''
  // The "For Bath" band drops the centered header and lets the anchor label
  // lead the carousel column instead.
  const inlineHeader = collection?.headerLayout === 'inline'
  // The plain band's copy: the homepage's default, or whatever the caller passes.
  const customHeading = heading !== undefined
  const plainHeading = heading ?? {
    title: 'Featured',
    eyebrow: 'Our Top Picks',
    description: 'Discover our most loved products — premium quality for everyday comfort.',
  }
  const sectionBackground = background ?? (collection ? 'white' : 'cream')
  // Without a promo photograph the two-column grid would leave the carousel in a
  // half-empty track, so it collapses to a single full-width column.
  const gridClass = !promo
    ? collection
      ? inlineHeader
        ? ''
        : 'mt-12'
      : 'mt-8'
    : collection
      ? inlineHeader
        ? 'grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-8'
        : promoSide === 'left'
          ? 'mt-12 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:gap-10'
          : 'mt-12 grid gap-6 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] lg:gap-10'
      : 'mt-8 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)] md:gap-6'
  // Label on the left with the rule running out to the right — the "For Bath"
  // and "For Hair" treatment.
  const anchorLeft = inlineHeader || collection?.anchorLayout === 'left'

  return (
    <section
      aria-label={collection?.heading ?? collection?.anchor ?? plainHeading.title}
      className={`${sectionBackground === 'white' ? 'bg-white' : 'bg-cream'} ${className ?? ''}`}
    >
      <div className="container-page py-12 lg:py-16">
        {collection && !inlineHeader ? (
          <header className="text-center">
            <h2 className="text-3xl leading-tight font-medium text-navy sm:text-4xl">
              {headingBefore ? (
                <>
                  {headingBefore}{' '}
                </>
              ) : null}
              {highlight ? (
                <span className="relative inline-block text-terracotta">
                  {highlight}
                  <Swoosh className="pointer-events-none absolute -bottom-3 -left-2 h-3 w-[calc(100%+1rem)]" />
                </span>
              ) : null}
              {headingAfter ? (
                <>
                  {' '}
                  {headingAfter}
                </>
              ) : null}
            </h2>
            <p className="mx-auto mt-8 max-w-4xl text-base leading-relaxed tracking-[0.04em] text-ink sm:text-lg">
              {collection.body}
            </p>
          </header>
        ) : collection ? null : (
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <div>
              {plainHeading.eyebrow ? (
                <p className="flex items-center gap-3 text-[0.8125rem] font-medium tracking-[0.28em] text-terracotta uppercase">
                  <span aria-hidden className="h-0.5 w-10 bg-terracotta" />
                  {plainHeading.eyebrow}
                </p>
              ) : null}
              <h2
                className={
                  customHeading
                    ? 'text-2xl font-medium text-navy sm:text-[1.75rem]'
                    : 'mt-2 text-4xl font-medium text-navy sm:text-[2.75rem]'
                }
              >
                {plainHeading.title}
              </h2>
              {plainHeading.description ? (
                <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">
                  {plainHeading.description}
                </p>
              ) : null}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => rewindTrack(trackRef.current)}
                aria-label="Previous products"
                className="btn inline-flex size-11 items-center justify-center border border-border bg-white text-navy shadow-sm transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => advanceTrack(trackRef.current)}
                aria-label="Next products"
                className="btn inline-flex size-11 items-center justify-center border border-border bg-white text-navy shadow-sm transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white"
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          </div>
        )}

        <div className={gridClass}>
          {promo ? (
            <div
              className={collection
                ? inlineHeader
                  ? 'relative aspect-square overflow-hidden rounded-2xl md:self-start'
                  : promoSide === 'left'
                    ? 'relative aspect-[4/5] self-start overflow-hidden rounded-2xl'
                    : 'relative order-2 aspect-[4/5] overflow-hidden rounded-2xl md:aspect-auto'
                : 'relative hidden overflow-hidden rounded-xl md:block'}
            >
              <Image
                src={promo.src}
                alt={promo.alt}
                fill
                sizes={collection ? '(min-width: 1344px) 350px, (min-width: 768px) 28vw, 100vw' : '(min-width: 1024px) 30vw, 40vw'}
                quality={collection ? 75 : 82}
                className="object-cover"
                style={promo.style}
              />
            </div>
          ) : null}

          <div
            className="min-w-0"
            onMouseEnter={() => {
              pausedRef.current = true
            }}
            onMouseLeave={() => {
              pausedRef.current = false
            }}
            onFocus={() => {
              pausedRef.current = true
            }}
            onBlur={() => {
              pausedRef.current = false
            }}
          >
            {collection?.anchor ? (
              anchorLeft ? (
                /* Label left, rule running out to the right. */
                <div className="mb-6 flex items-center gap-4">
                  <p className="shrink-0 text-2xl font-medium text-ink-soft">{collection.anchor}</p>
                  <span aria-hidden className="h-px flex-1 bg-border" />
                </div>
              ) : (
                <p className="mb-6 border-b border-border pb-2 text-right text-2xl font-medium text-ink-soft">
                  {collection.anchor}
                </p>
              )
            ) : null}
            <ul
              ref={trackRef}
              onScroll={handleScroll}
              /* contain-paint keeps this scroll track's overflow region out of
                 the page's own scrollable area (no phantom horizontal scroll).
                 It also clips paint to the padding box, so the vertical padding
                 (cancelled by the negative margin, leaving the layout untouched)
                 is what gives the cards room to lift and cast a shadow. */
              className="-my-5 flex contain-paint snap-x snap-mandatory gap-3 overflow-x-auto py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {cards.map((product, index) => (
                <li key={`${product.slug}-${index}`} className={cardWidth}>
                  {/* The card carries its own rounded frame, resting shadow and hover
                      lift, so no wrapper is needed here — and adding one would stack a
                      second scale on top of the card's own. */}
                  <ProductCard product={product} priority={!collection && index === 0} showFeaturedBadge={false} />
                </li>
              ))}
            </ul>

            {/* One dot per product, following the card at the left edge. */}
            <div className="mt-6 flex justify-center gap-2">
              {products.map((product, index) => (
                <button
                  key={product.slug}
                  type="button"
                  onClick={() => trackRef.current?.scrollTo({ left: index * stepOf(trackRef.current), behavior: 'smooth' })}
                  aria-label={`Go to slide ${index + 1}: ${product.name}`}
                  aria-current={active === index ? true : undefined}
                  className={`h-2 rounded-full transition-[width,background-color] duration-200 ${
                    active === index
                      ? collection ? 'w-8 bg-ink' : 'w-2 bg-navy'
                      : 'w-2 bg-navy/20 hover:bg-navy/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
