import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment, type CSSProperties } from 'react'
import { CollectionBlock } from '@/components/home/collection-block'
import { CollectionShowcase } from '@/components/home/collection-showcase'
import { FaqSection } from '@/components/home/faq-section'
import { FeaturedShowcase } from '@/components/home/featured-showcase'
import { Hero } from '@/components/home/hero'
import { MarqueeStripe } from '@/components/home/marquee-stripe'
import { ProductsReels } from '@/components/home/products-reels'
import { SectionHeading, Swoosh } from '@/components/home/section-heading'
import { Testimonials } from '@/components/home/testimonials'
import { categoryBanner, featuredPromo, heroImages, ogImage } from '@/lib/catalogue/media'
import { featuredProducts, productsInCategory } from '@/lib/catalogue'
import { categoryPath } from '@/lib/catalogue/paths'
import { brandStatement, collections } from '@/lib/content/site-content'
import { buildMetadata } from '@/lib/seo/metadata'
import { legacyPageMetadata } from '@/lib/seo/legacy-metadata'
import { siteConfig } from '@/lib/site-config'

const harvested = legacyPageMetadata('/')

export const metadata: Metadata = buildMetadata({
  path: '/',
  title: harvested.title ?? `${siteConfig.tagline} | ${siteConfig.name}`,
  titleMode: 'absolute',
  description: harvested.description ?? siteConfig.description,
})

/**
 * The genuine JAF product reels, served from the jsDelivr CDN. Each carries a
 * poster frame pulled from the film itself (see `scripts/generate-reel-posters.mjs`)
 * so the band shows a real preview before a visitor presses play — with
 * `preload="none"` the poster is the only thing that loads up front.
 */
const REEL_CDN = 'https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main'
const reels = [
  { src: `${REEL_CDN}/jaftradings01.mp4`, poster: '/images/reels/jaftradings01.webp', alt: 'JAF product reel 01' },
  { src: `${REEL_CDN}/jaftradings02.mp4`, poster: '/images/reels/jaftradings02.webp', alt: 'JAF product reel 02' },
  { src: `${REEL_CDN}/p01.mp4`, poster: '/images/reels/p01.webp', alt: 'JAF product reel — p01' },
  { src: `${REEL_CDN}/gallery/jaftradings14.mp4`, poster: '/images/reels/jaftradings14.webp', alt: 'JAF product reel 14' },
  { src: `${REEL_CDN}/gallery/p04.mp4`, poster: '/images/reels/p04.webp', alt: 'JAF product reel — p04' },
  { src: `${REEL_CDN}/gallery/p05.mp4`, poster: '/images/reels/p05.webp', alt: 'JAF product reel — p05' },
  { src: `${REEL_CDN}/gallery/p06.mp4`, poster: '/images/reels/p06.webp', alt: 'JAF product reel — p06' },
  { src: `${REEL_CDN}/gallery/p07.mp4`, poster: '/images/reels/p07.webp', alt: 'JAF product reel — p07' },
  { src: `${REEL_CDN}/gallery/p08.mp4`, poster: '/images/reels/p08.webp', alt: 'JAF product reel — p08' },
  { src: `${REEL_CDN}/gallery/p09.mp4`, poster: '/images/reels/p09.webp', alt: 'JAF product reel — p09' },
  { src: `${REEL_CDN}/gallery/p10.mp4`, poster: '/images/reels/p10.webp', alt: 'JAF product reel — p10' },
  { src: `${REEL_CDN}/gallery/p11.mp4`, poster: '/images/reels/p11.webp', alt: 'JAF product reel — p11' },
  { src: `${REEL_CDN}/gallery/jaftradings13.mp4`, poster: '/images/reels/jaftradings13.webp', alt: 'JAF product reel 13' },
]

/** Collections rendered as a promo photograph beside a category carousel. */
const showcaseCollections: Record<
  string,
  { highlight: string; src: string; width: number; height: number; alt: string; style?: CSSProperties }
> = {
  'bedding-collection': {
    highlight: 'Bedding',
    src: 'https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/Delilah_Home_Towels_223_5_colors_square.jpg',
    width: 876,
    height: 1048,
    alt: 'Bedding collection lifestyle photograph',
  },
  'bath-slipper-collection': {
    highlight: 'Bath Slipper',
    src: 'https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/gallery/bathslipper.webp',
    width: 1254,
    height: 1254,
    alt: 'JAF cotton bath slippers on a marble bathroom floor',
  },
  'hair-wrap-collection': {
    highlight: 'Wrap Turban',
    src: 'https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/gallery/jaftradings.combathhair010.webp',
    width: 1024,
    height: 1024,
    alt: 'JAF cotton hair wrap turbans — 380 GSM super soft luxury shower wraps',
    // The square crop sits slightly off-centre inside the 4/5 frame, so it is
    // nudged left, allowed past the frame's edge, and stretched to fill rather
    // than cover-cropped.
    //
    // The 400px is set with `minWidth`, not `width`: `next/image`'s `fill`
    // writes `width: 100%` inline and throws if a `style.width` is supplied
    // ("Images with fill always use width 100% - it cannot be modified"). A
    // minimum is not blocked, and `min-width` beats the smaller `width: 100%`
    // in the cascade — so the frame measures ~350px and the image lands on
    // exactly 400px. `maxWidth: 'none'` keeps the old 114% cap from clamping it.
    style: { left: -46, minWidth: 400, maxWidth: 'none', objectFit: 'inherit' },
  },
}

/**
 * The "For Bath" band sits above the Bath Slipper block: a lifestyle photograph
 * on the left, and the same auto-looping carousel on the right, stocked with
 * bathrobes and towels from the `bath/towels` category.
 */
const forBathPromo = {
  src: 'https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/61b_NSE-kEL._AC_SX679.jpg',
  width: 679,
  height: 679,
  alt: 'A couple wearing soft white JAF cotton bathrobes',
}

export default function HomePage() {
  const featured = featuredProducts(8)

  // Bathrobes and towels: featured first, then anything else with photography,
  // capped so the dot rail stays readable.
  const bathTowels = productsInCategory('bath/towels')
  const forBath = [
    ...bathTowels.filter((product) => product.featured),
    ...bathTowels.filter((product) => !product.featured && product.images.length > 0),
  ].slice(0, 8)

  const showcase = [
    {
      title: 'Bedsheet',
      href: categoryPath('bedding/sheet-pillow-cases'),
      banner: categoryBanner('bedding', 'Fitted bedsheets and pillow covers from the JAF bedding collection'),
    },
    {
      title: 'Bathrobes',
      href: categoryPath('bath/towels/bathrobes'),
      banner: categoryBanner('bath/towels/bathrobes', 'A folded JAF cotton bathrobe'),
    },
    {
      title: 'Luxury Towels',
      href: categoryPath('bath/towels'),
      banner: categoryBanner('bath/towels', 'Stacked JAF cotton bath towels'),
    },
  ]

  return (
    <>
      {/* The opening screen: the hero crossfade — two suites, a new one every
          four seconds — with the copy set over it. */}
      <Hero images={heroImages.length > 0 ? heroImages : [ogImage]} />

      {/* The brand lines, running edge to edge straight off the hero. */}
      <MarqueeStripe />

      {/* Brand statement — the live homepage's own H1 copy. */}
      <section className="container-page py-12 text-center lg:py-14">
        <h1 className="mx-auto max-w-3xl text-[1.75rem] leading-tight font-medium text-navy sm:text-[2.125rem]">
          {brandStatement.heading}
        </h1>
        <Swoosh className="mt-3 h-2 w-28" centered />
        <p className="mx-auto mt-5 max-w-3xl text-[17px] leading-relaxed text-ink-soft">
          {brandStatement.body}
        </p>
      </section>

      {/* Featured — the live page's top-picks showcase: promo photo + one-card auto-looping carousel. */}
      <FeaturedShowcase products={featured} promo={featuredPromo} />

      {/* Category banners from the live homepage — anchored as the hero's "Explore Collection" target. */}
      <section id="collections" className="container-page scroll-mt-24 py-12 lg:py-14">
        <SectionHeading
          eyebrow="Shop by category"
          title="Where would you like to start?"
          align="center"
          swoosh
        />
        <div className="mt-8">
          <CollectionShowcase items={showcase} />
        </div>
      </section>

      {collections.map((collection) => {
        const showcase = showcaseCollections[collection.id]

        return (
          <Fragment key={collection.id}>
            {/* The "For Bath" band leads the bath area, directly above the Bath Slipper block. */}
            {collection.id === 'bath-slipper-collection' && (
              <FeaturedShowcase
                collection={{ anchor: 'For Bath', headerLayout: 'inline' }}
                products={forBath}
                promo={forBathPromo}
              />
            )}
            {/* The bedding banner artwork sits directly above the Bedding Collection block. */}
            {collection.id === 'bedding-collection' && (
              <section aria-label="Bedding collection banner" className="container-page mt-4">
                <Link
                  href="/product-category/bedding/"
                  className="group block overflow-hidden rounded-2xl shadow-[0_20px_50px_-20px_rgba(8,40,75,0.35)] sm:rounded-3xl"
                >
                  <Image
                    src="https://cdn.jsdelivr.net/gh/SrkJaffri/jaftradings@main/beddingbanner.avif"
                    alt="Bedding Collection — premium cotton bedsheets, blankets, duvet covers and pillowcases"
                    width={1626}
                    height={759}
                    sizes="(min-width: 1280px) 1180px, 94vw"
                    className="h-auto w-full transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.01]"
                  />
                </Link>
              </section>
            )}
            {/* The bathrobe banner sits directly above the Bath Slipper block, same treatment as the bedding banner. */}
            {collection.id === 'bath-slipper-collection' && (
              <section aria-label="Bathrobe collection banner" className="container-page mt-4">
                <Link
                  href={categoryPath('bath/towels/bathrobes')}
                  className="group block overflow-hidden rounded-2xl shadow-[0_20px_50px_-20px_rgba(8,40,75,0.35)] sm:rounded-3xl"
                >
                  <Image
                    src="https://cdn.jsdelivr.net/gh/SrkJaffri/jaftradings@main/bathrobebanner.avif"
                    alt="Bathrobe Collection — premium cotton bathrobes, towels and hair wraps"
                    width={1672}
                    height={941}
                    sizes="(min-width: 1280px) 1180px, 94vw"
                    className="h-auto w-full transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.01]"
                  />
                </Link>
              </section>
            )}
            {/* The hair-wrap banner sits directly above the Hair Wrap Turban block, same treatment as the bedding banner. */}
            {collection.id === 'hair-wrap-collection' && (
              <section aria-label="Hair wrap collection banner" className="container-page mt-4">
                <Link
                  href={categoryPath('bath/towels/shower-wrap')}
                  className="group block overflow-hidden rounded-2xl shadow-[0_20px_50px_-20px_rgba(8,40,75,0.35)] sm:rounded-3xl"
                >
                  <Image
                    src="https://cdn.jsdelivr.net/gh/SrkJaffri/jaftradings@main/wrapbanner.avif"
                    alt="Hair Wrap Turbans — soft, secure, frizz-free cotton hair wraps"
                    width={1652}
                    height={744}
                    sizes="(min-width: 1280px) 1180px, 94vw"
                    className="h-auto w-full transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-[1.01]"
                  />
                </Link>
              </section>
            )}
            {showcase ? (
              <FeaturedShowcase
                collection={{
                  heading: collection.heading,
                  body: collection.body,
                  anchor: collection.anchor,
                  highlight: showcase.highlight,
                  // "For Hair" leads its carousel column on the left, matching "For Bath".
                  anchorLayout: collection.id === 'hair-wrap-collection' ? 'left' : undefined,
                }}
                products={productsInCategory(collection.categoryPath)}
                promo={showcase}
                promoSide={collection.id === 'hair-wrap-collection' ? 'left' : 'right'}
              />
            ) : (
              <CollectionBlock
                anchor={collection.anchor}
                heading={collection.heading}
                body={collection.body}
                href={collection.categoryHref}
                linkLabel="View all"
                products={productsInCategory(collection.categoryPath).slice(0, 4)}
              />
            )}
          </Fragment>
        )
      })}

      <ProductsReels reels={reels} />

      <Testimonials />

      <FaqSection />

      {/* Map — the live homepage closes with the business map above the footer. */}
      <section aria-label="Find JAF Global Trading" className="border-t border-border">
        <iframe
          title="Map showing JAF Global Trading's location"
          src={siteConfig.contact.address.mapEmbedBusiness}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-72 w-full border-0 lg:h-96"
        />
      </section>
    </>
  )
}
