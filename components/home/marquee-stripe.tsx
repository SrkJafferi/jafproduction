import { Fragment } from 'react'

/**
 * The band of brand lines that runs directly under the homepage hero.
 *
 * Purely decorative, so it stays a **Server Component with no JavaScript at
 * all** — the motion is one CSS transform animation (see `--animate-marquee`
 * in `globals.css`).
 *
 * Seamlessness comes from the geometry rather than from any script: the track
 * holds **two identical sequences** and slides left by exactly one of them
 * (`translateX(-50%)` of a track that is precisely two sequences wide), so the
 * frame at the end is identical to the frame at the start and the wrap is
 * invisible.
 *
 * That exactness is why **no `gap` is used anywhere** — not on the track, not
 * inside a sequence. A gap between the two sequences would make the track wider
 * than two sequences and `-50%` would no longer land on the seam. Instead every
 * item carries the same inline padding, which also spaces the seam itself: the
 * sequence ends on a separator, so the last `✦` sits the same distance from the
 * next sequence's first phrase as any other separator does.
 */

/**
 * Written in sentence case and uppercased in CSS — screen readers announce
 * all-caps runs letter by letter far more often than they do normal words.
 * The trailing separator is deliberate: it is what spaces the loop boundary.
 */
const PHRASES = [
  'Softness in every detail',
  'Luxury bath towels',
  'Wrap yourself in comfort',
  'Premium bathrobes',
  'Elevate your everyday living',
  'Elegant bedding',
  'Comfort meets style',
  'Bath & home essentials',
]

/**
 * One pass of the sequence, ending on a separator so the join to the next
 * sequence is spaced like every other item. The duplicate is hidden from
 * assistive technology, which leaves the phrases announced exactly once.
 */
function Sequence({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {PHRASES.map((phrase) => (
        <Fragment key={phrase}>
          <span className="px-5 sm:px-8">{phrase}</span>
          <span aria-hidden className="px-5 text-terracotta sm:px-8">
            ✦
          </span>
        </Fragment>
      ))}
    </div>
  )
}

export function MarqueeStripe() {
  return (
    /* `overflow-hidden` is what keeps the deliberately-too-wide track from
       widening the page; the stripe itself is a plain full-bleed block. */
    <section aria-label="JAF Global Trading brand highlights" className="overflow-hidden bg-navy">
      {/* Fixed height so the band never shifts as fonts settle, and
          `items-center` does the vertical centring for both the text and the
          separators. `motion-reduce:animate-none` parks the track on its first
          frame instead of letting the global reduced-motion rule fast-forward
          it to the last — the copy stays put and readable. */}
      <div className="flex h-[46px] w-max shrink-0 animate-marquee items-center text-[13px] font-medium tracking-[0.08em] whitespace-nowrap text-white uppercase motion-reduce:animate-none md:h-[58px] md:text-[15px]">
        <Sequence />
        <Sequence hidden />
      </div>
    </section>
  )
}
