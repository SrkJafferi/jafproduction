'use client'

import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Swoosh } from '@/components/home/section-heading'
import { testimonials } from '@/lib/content/site-content'
import type { Testimonial } from '@/lib/content/site-content'

/**
 * "What Our Customers Say" — the six published testimonials as a card carousel.
 *
 * The mechanics mirror the product showcase: a native scroll-snap track that
 * advances one card per step, cloned lead cards so the wrap at the end lands on
 * a frame identical to the start, and autoplay that only scrolls (the active dot
 * is derived in the scroll handler, so no state is set inside an effect).
 * Autoplay pauses on hover/focus and is skipped for reduced-motion visitors.
 *
 * No ratings were published on the live storefront, so the star row is a
 * presentation-only flourish; if that ever matters, delete the `StarRow`.
 */

const AUTOPLAY_MS = 5200
/** Max cards ever visible at once — enough clones for a seamless wrap. */
const CLONE_COUNT = 3

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

/** Two letters at most — "Ahmed Raza" → "AR". */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

function StarRow() {
  return (
    <div className="flex gap-0.5 text-terracotta" aria-label="Rated 5 out of 5">
      {[0, 1, 2, 3, 4].map((index) => (
        <Star key={index} className="size-3.5 fill-current" aria-hidden strokeWidth={0} />
      ))}
    </div>
  )
}

/**
 * The author's portrait when the data carries one; otherwise a navy monogram,
 * so the card never implies a customer photograph that does not exist.
 */
function Avatar({ testimonial }: { testimonial: Testimonial }) {
  if (testimonial.avatar) {
    return (
      <Image
        src={testimonial.avatar}
        alt=""
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-full object-cover"
      />
    )
  }

  return (
    <span
      aria-hidden
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-[0.8125rem] font-medium tracking-[0.06em] text-white"
    >
      {initialsOf(testimonial.author)}
    </span>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-[0_14px_40px_-24px_rgba(8,40,75,0.35)] transition-[box-shadow,transform,scale,translate] duration-300 ease-[var(--ease-premium)] hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_16px_34px_-14px_rgba(8,40,75,0.45)]">
      <div className="flex items-center justify-between gap-4">
        <Quote className="size-7 fill-current text-terracotta/25" aria-hidden />
        <StarRow />
      </div>

      <blockquote className="mt-5 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft italic">
        <span aria-hidden>&ldquo;</span>
        {testimonial.quote}
        <span aria-hidden>&rdquo;</span>
      </blockquote>

      <footer className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <Avatar testimonial={testimonial} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-navy">{testimonial.author}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{testimonial.role}</p>
        </div>
      </footer>
    </article>
  )
}

export function Testimonials() {
  const trackRef = useRef<HTMLUListElement>(null)
  const pausedRef = useRef(false)
  const [active, setActive] = useState(0)

  // Autoplay: the interval only scrolls the track; pausing is a ref flag, so
  // no state is ever set inside the effect.
  useEffect(() => {
    if (testimonials.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      if (!pausedRef.current) advanceTrack(trackRef.current)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [])

  const handleScroll = () => {
    const track = trackRef.current
    if (!track) return
    setActive(Math.round(track.scrollLeft / stepOf(track)) % testimonials.length)
  }

  const cards = [...testimonials, ...testimonials.slice(0, CLONE_COUNT)]

  const arrowClass =
    'btn absolute top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center border border-border bg-white text-navy shadow-[0_8px_24px_-14px_rgba(8,40,75,0.5)] transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white sm:inline-flex'

  return (
    <section className="border-y border-border bg-cream" aria-label="Customer feedback">
      <div className="container-page py-14 lg:py-16">
        <header className="text-center">
          <p className="flex items-center justify-center gap-4 text-[0.6875rem] font-medium tracking-[0.28em] text-terracotta uppercase">
            <span aria-hidden className="h-px w-8 bg-terracotta/40 sm:w-12" />
            Customer feedback
            <span aria-hidden className="h-px w-8 bg-terracotta/40 sm:w-12" />
          </p>

          <h2 className="mt-4 text-3xl leading-tight font-medium text-navy sm:text-[2.375rem]">
            What{' '}
            <span className="relative inline-block text-terracotta">
              Our Customers Say
              <Swoosh className="pointer-events-none absolute -bottom-2 left-0 h-2.5 w-full" />
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-soft">
            Trusted by homes, hotels and businesses across Pakistan &amp; beyond.
          </p>
        </header>

        <div
          className="relative mt-12 sm:px-12"
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
            /* contain-paint keeps this scroll track's overflow region out of the
               page's own scrollable area (no phantom horizontal scroll). It also
               clips paint to the padding box, so the vertical padding (cancelled
               by the negative margin) is what gives the cards room to lift and
               cast a shadow — the same treatment the product carousels use. */
            className="-my-5 flex contain-paint snap-x snap-mandatory gap-5 overflow-x-auto py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {cards.map((testimonial, index) => (
              <li
                key={`${testimonial.author}-${index}`}
                className="w-[86%] flex-none snap-start sm:w-[calc(50%-10px)] lg:w-[calc((100%-40px)/3)]"
              >
                <TestimonialCard testimonial={testimonial} />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => rewindTrack(trackRef.current)}
            aria-label="Previous testimonials"
            className={`${arrowClass} left-0`}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => advanceTrack(trackRef.current)}
            aria-label="Next testimonials"
            className={`${arrowClass} right-0`}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        {/* One dot per testimonial, following the card at the left edge. */}
        <div className="mt-8 flex justify-center gap-2">
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.author}
              type="button"
              onClick={() =>
                trackRef.current?.scrollTo({ left: index * stepOf(trackRef.current), behavior: 'smooth' })
              }
              aria-label={`Go to testimonial ${index + 1}: ${testimonial.author}`}
              aria-current={active === index ? true : undefined}
              className={`h-2 rounded-full transition-[width,background-color] duration-200 ${
                active === index ? 'w-8 bg-navy' : 'w-2 bg-navy/20 hover:bg-navy/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
