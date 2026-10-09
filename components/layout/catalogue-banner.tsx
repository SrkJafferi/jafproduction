import Image from 'next/image'
import { Breadcrumbs, type Crumb } from '@/components/ui/breadcrumbs'

type CatalogueBannerProps = {
  /** Full page title. */
  title: string
  /**
   * Trailing words of the title to print in the brand orange — the design picks
   * the brand name out of the SEO title rather than rewriting it.
   */
  highlight?: string
  subtitle?: string
  trail: Crumb[]
  image: { src: string; alt: string }
}

/**
 * The shop's opening band: a wide still-life photograph with the breadcrumb, the
 * page title and a one-line summary set over its brighter left side. The wash
 * runs cream-to-transparent so the copy stays legible without veiling the towels
 * on the right.
 */
export function CatalogueBanner({ title, highlight, subtitle, trail, image }: CatalogueBannerProps) {
  const hasHighlight = Boolean(highlight) && title.endsWith(highlight!)
  const lead = hasHighlight ? title.slice(0, title.length - highlight!.length) : title

  return (
    <section className="relative overflow-hidden bg-cream">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
        quality={80}
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-cream via-cream/85 to-cream/5" />

      <div className="container-page relative py-9 lg:py-11">
        <Breadcrumbs trail={trail} />
        <h1 className="mt-3.5 max-w-2xl text-[1.375rem] leading-tight font-semibold text-navy sm:text-[1.75rem]">
          {lead}
          {hasHighlight ? <span className="text-terracotta">{highlight}</span> : null}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-soft">{subtitle}</p>
        ) : null}
      </div>
    </section>
  )
}
