'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SectionHeading } from '@/components/home/section-heading'

type Reel = {
  src: string
  poster?: string
  alt: string
}

/**
 * The "Products Reels" band from the live homepage: the full run of short
 * portrait product films in a native scroll-snap carousel. `preload="none"`
 * keeps every video off the network until a visitor actually presses play, so
 * the band costs nothing on load.
 *
 * The carousel follows the same pattern as the Featured/collection showcases:
 * a snap track that advances one card per step, prev/next controls, one dot per
 * reel, and a seamless wrap. Autoplay only scrolls the track (no state is set
 * inside effects) and is skipped for visitors who prefer reduced motion.
 */

const AUTOPLAY_MS = 5000

/**
 * One card's width per breakpoint. The track's gap is `gap-4` (16px), so an
 * N-up rail leaves N-1 gaps: `(100% - 16px * (N - 1)) / N`. Written out rather
 * than interpolated because Tailwind only emits classes it can see literally.
 */
const CARD_WIDTH =
  'w-[64%] flex-none snap-start sm:w-[calc(50%-8px)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)]'

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

export function ProductsReels({ reels }: { reels: Reel[] }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const pausedRef = useRef(false)
  const [active, setActive] = useState(0)

  // Autoplay: the interval only scrolls the track; pausing is a ref flag, so
  // no state is ever set inside the effect.
  useEffect(() => {
    if (reels.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      if (!pausedRef.current) advanceTrack(trackRef.current)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [reels.length])

  const handleScroll = () => {
    const track = trackRef.current
    if (!track) return
    setActive(Math.round(track.scrollLeft / stepOf(track)) % reels.length)
  }

  // Clone the lead cards so the wrap at the end lands on a frame identical to
  // the start, letting the loop read as seamless rather than snapping back.
  const cloneCount = Math.min(4, reels.length)
  const cards = [...reels, ...reels.slice(0, cloneCount)]

  if (reels.length === 0) return null

  return (
    <section className="bg-navy-deep" aria-label="Products Reels">
      <div className="container-page py-12 lg:py-14">
        <SectionHeading
          eyebrow="In motion"
          title="Products Reels"
          align="left"
          tone="onDark"
          link={{ href: '/shop/', label: 'Shop the range' }}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => rewindTrack(trackRef.current)}
            aria-label="Previous reels"
            className="btn inline-flex size-11 items-center justify-center border border-white/25 bg-white/5 text-white transition-colors duration-200 hover:border-white hover:bg-white hover:text-navy"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => advanceTrack(trackRef.current)}
            aria-label="Next reels"
            className="btn inline-flex size-11 items-center justify-center border border-white/25 bg-white/5 text-white transition-colors duration-200 hover:border-white hover:bg-white hover:text-navy"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        <div
          className="mt-5"
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
          <ul
            ref={trackRef}
            onScroll={handleScroll}
            className="-my-5 flex contain-paint snap-x snap-mandatory gap-4 overflow-x-auto py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {cards.map((reel, index) => (
              <li key={`${reel.src}-${index}`} className={CARD_WIDTH}>
                {/* The films are not all portrait — the set mixes 9:16, 2:3,
                    1:1 and 16:9 — so the frame is a fixed reel-shaped card and
                    the film is `object-contain`ed inside it. That keeps the
                    carousel row aligned while showing each film whole instead
                    of cropping a landscape clip to a vertical slice. The
                    `bg-navy` panel is a shade off the section's `navy-deep`, so
                    the letterboxing reads as a deliberate frame. */}
                <video
                  className="aspect-9/16 w-full overflow-hidden rounded-2xl bg-navy object-contain"
                  src={reel.src}
                  poster={reel.poster}
                  controls
                  preload="none"
                  muted
                  loop
                  playsInline
                  aria-label={reel.alt}
                >
                  Your browser does not support embedded video.
                </video>
              </li>
            ))}
          </ul>

          {/* One dot per reel, following the card at the left edge. */}
          <div className="mt-6 flex justify-center gap-2">
            {reels.map((reel, index) => (
              <button
                key={reel.src}
                type="button"
                onClick={() =>
                  trackRef.current?.scrollTo({ left: index * stepOf(trackRef.current), behavior: 'smooth' })
                }
                aria-label={`Go to reel ${index + 1}`}
                aria-current={active === index ? true : undefined}
                className={`h-2 rounded-full transition-[width,background-color] duration-200 ${
                  active === index ? 'w-8 bg-white' : 'w-2 bg-white/25 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
