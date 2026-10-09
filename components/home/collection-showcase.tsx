import Image from 'next/image'
import Link from 'next/link'
import type { MediaImage } from '@/lib/catalogue/media'

type ShowcaseItem = {
  title: string
  href: string
  banner?: MediaImage
}

/**
 * The three category tiles from the live homepage (Bedsheet / Bathrobes /
 * Luxury Towels): a real brand photo with an inset keyline frame, the
 * category name and a "View All" link centred inside the frame. When a
 * banner is missing the tile falls back to a soft neutral panel rather
 * than a substitute photograph.
 */
export function CollectionShowcase({ items }: { items: ShowcaseItem[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group relative block aspect-4/3 overflow-hidden border border-border bg-surface sm:aspect-[19/10]"
            aria-label={`${item.title} — view all products`}
          >
            {item.banner ? (
              <Image
                src={item.banner.src}
                alt={item.banner.alt}
                fill
                sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                quality={78}
                className="object-cover transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.04]"
              />
            ) : (
              <span className="absolute inset-0 bg-linear-to-br from-surface to-surface-muted" aria-hidden />
            )}

            {/* Inset keyline frame, as on the live homepage tiles. */}
            <span
              className="pointer-events-none absolute inset-5 border border-white/80 transition-[border-color] duration-300 group-hover:border-white sm:inset-7"
              aria-hidden
            />

            <span className="absolute inset-5 flex flex-col justify-center gap-1.5 pl-6 sm:inset-7 sm:pl-8">
              <span className="text-[1.65rem] leading-snug font-medium text-navy drop-shadow-[0_1px_6px_rgba(255,255,255,0.65)] sm:text-3xl">
                {item.title}
              </span>
              <span className="text-sm font-normal text-navy/80 drop-shadow-[0_1px_6px_rgba(255,255,255,0.65)] transition-colors duration-200 group-hover:text-navy">
                View All
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
