import { ArrowRight, Cloud, Hotel, Leaf } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { MediaImage } from '@/lib/catalogue/media'
import { generalEnquiryUrl } from '@/lib/whatsapp'

/**
 * The homepage's opening screen: a crossfade between hotel suites styled with JAF
 * towels and robes, with the hero copy set over it as real text — eyebrow,
 * headline, one-line description, the three promises and the two calls to action.
 *
 * The headline is deliberately two lines rather than one wrapping paragraph:
 * "Luxury Bath Towels," carries the accent colour over the navy break, and the
 * two blocks are sized so neither ever wraps on its own — from a 320px phone to
 * a 1920px display the lockup stays exactly two lines.
 *
 * The frame is full-bleed — edge to edge, square corners, 16:9 from `lg`,
 * object-fit cover — and is pulled up under the transparent header so the bar
 * sits on the artwork. The crossfade and the push-in are pure CSS, so this stays
 * a server component and ships no JavaScript; `prefers-reduced-motion` collapses
 * them, which parks the hero on its first photograph.
 *
 * Ordering happens over WhatsApp, so "Enquire Now" opens the same channel as
 * the header and float button.
 */

/** The three promises the collection stands on. */
const highlights = [
  { icon: Cloud, label: 'Soft & Absorbent' },
  { icon: Hotel, label: 'Hotel Quality' },
  { icon: Leaf, label: 'Everyday Comfort' },
]

/** Length of one full crossfade cycle, in seconds — kept in step with the CSS. */
const CYCLE_SECONDS = 8

export function Hero({ images }: { images: MediaImage[] }) {
  const crossfade = images.length > 1

  return (
    <section
      aria-label="JAF Global Trading — luxury home textiles"
      // Pulled up under the transparent header so the bar sits on the artwork.
      // The offset matches the header's own height exactly.
      className="-mt-16 pb-2.5 lg:-mt-[4.5rem]"
    >
      <div className="relative w-full overflow-hidden bg-cream">
        {/* The photographs are stacked and crossfade. Each is offset by a share of
            the cycle, so photograph N fades out exactly as N+1 fades in. The
            keyframes assume two photographs — see `--animate-hero-fade`.
            Everything past the first also carries `opacity-0` as its base state:
            the animation always overrides that, but when the global
            `prefers-reduced-motion` rule ends the animation at once it leaves the
            base state behind — one still photograph, not two stacked at full
            opacity with the last one painting over the rest. */}
        {images.map((image, index) => {
          const delay = crossfade ? `-${(index * CYCLE_SECONDS) / images.length}s` : undefined
          const hiddenByDefault = crossfade && index > 0

          return (
            <div
              key={image.src}
              className={`absolute inset-0 ${crossfade ? 'animate-hero-fade' : ''} ${
                hiddenByDefault ? 'opacity-0' : ''
              }`}
              style={delay ? { animationDelay: delay } : undefined}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="100vw"
                quality={82}
                // The first photograph is the LCP. The second loads eagerly too so
                // it is ready when its turn comes four seconds later, but without
                // the high fetch priority that would compete with the LCP.
                priority={index === 0}
                loading={index === 1 ? 'eager' : undefined}
                className={`object-cover ${crossfade ? 'animate-hero-zoom-in' : ''}`}
                style={delay ? { animationDelay: delay } : undefined}
              />
            </div>
          )
        })}

        {/* A cream wash keeps the copy readable without veiling the room. It is
            tuned to the lightest value that still clears WCAG against the real
            pixels: below `lg` the copy spans most of the frame, so the wash runs
            top-to-bottom; from `lg` the copy occupies the left third only, so
            the wash shelves across that third and then releases hard, leaving
            the right two thirds of the photograph almost untouched. The bar no
            longer gets a band of its own: only the thin haze below. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-cream/90 via-cream/76 to-cream/64 lg:bg-linear-to-r lg:from-cream/85 lg:via-cream/62 lg:via-30% lg:to-transparent"
        />

        {/* The bar's own band is gone, but the two right-hand controls land on
            the photograph's darkest pixels (luminance 0.02), so the header row
            keeps one thin haze: 40% cream at the very top edge — under half of
            the old band's weight there — peaking at the controls' glyph band
            and fully clear 96px down. Measured on the real pixels: currency
            6.1:1, bag 11.0:1, nav 14.5:1, logo 16.2:1, all clear of AA 4.5. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 hidden h-24 bg-linear-to-b from-cream/40 via-cream/85 via-40% to-transparent lg:block"
        />

        {/* Hero copy — eyebrow, offer, promise row, then the two CTAs. The
            column is wider than the description so the headline can hold its
            two-line break while the paragraph still reads as a measure. */}
        <div className="relative flex min-h-[560px] flex-col justify-center px-6 py-12 sm:px-10 lg:aspect-video lg:min-h-0 lg:px-14 lg:py-0 2xl:px-20">
          <div className="max-w-lg lg:max-w-xl 2xl:max-w-2xl">
            <p className="eyebrow flex items-center gap-3 2xl:gap-4 2xl:text-sm">
              <span>Premium Home Textiles</span>
              <span aria-hidden className="h-px w-14 bg-terracotta/45 sm:w-20 2xl:w-24" />
            </p>

            {/* Two blocks, not one wrapping paragraph: each line is sized to fit
                its own width, so the break never becomes a third line. */}
            <h1 className="mt-4 text-[clamp(1.125rem,6.9vw,2rem)] leading-[1.06] font-bold tracking-[-0.02em] text-navy sm:text-[2.5rem] lg:text-[3rem] 2xl:mt-5 2xl:text-[3.5rem]">
              <span className="block">
                Luxury <span className="text-terracotta">Bath Towels,</span>
              </span>
              <span className="block">Bathrobes &amp; Bedding</span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft lg:text-lg 2xl:mt-6 2xl:max-w-xl 2xl:text-xl">
              Premium quality bath, bedding and apparel essentials for homes, hotels and retailers.
            </p>

            {/* Filled badges, two-line labels and hairline dividers, as in the
                reference. A three-column grid from `sm` rather than a wrapping
                flex row: the three promises then share the width evenly and can
                never spill onto a second line, which a flex row did by 5px at
                exactly 640. On phones they still stack naturally. */}
            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4 sm:grid sm:grid-cols-3 sm:gap-x-0 2xl:mt-9">
              {highlights.map((item, index) => (
                <li
                  key={item.label}
                  className={`flex items-center gap-2.5 sm:px-4 sm:first:pl-0 sm:last:pr-0 2xl:gap-3.5 2xl:px-5 ${
                    index > 0 ? 'sm:border-l sm:border-navy/10' : ''
                  }`}
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-terracotta/12 text-navy 2xl:size-14">
                    <item.icon className="size-5 2xl:size-6" aria-hidden />
                  </span>
                  <span className="max-w-[5rem] text-sm leading-snug font-medium text-navy 2xl:max-w-[6.5rem] 2xl:text-base">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3 2xl:mt-9 2xl:gap-4">
              <Link
                href="/shop/"
                // Transparent border so the filled pill matches the outlined
                // one exactly: a border adds to an auto height, and the pair
                // would otherwise sit 2px apart.
                className="btn inline-flex items-center gap-2 border border-transparent bg-terracotta px-7 py-3.5 text-[0.9375rem] font-semibold text-white transition-colors duration-200 hover:bg-terracotta-dark 2xl:gap-3 2xl:px-9 2xl:py-4 2xl:text-base"
              >
                Shop Collection
                <ArrowRight className="size-4 2xl:size-5" aria-hidden />
              </Link>
              <a
                href={generalEnquiryUrl('your bath, bedding and bathrobe collections')}
                className="btn inline-flex items-center border border-navy/35 px-7 py-3.5 text-[0.9375rem] font-semibold text-navy transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white 2xl:px-9 2xl:py-4 2xl:text-base"
              >
                Enquire Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
