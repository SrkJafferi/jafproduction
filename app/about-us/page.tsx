import type { Metadata } from 'next'
import Image from 'next/image'
import { PageBanner } from '@/components/layout/page-banner'
import { SectionHeading } from '@/components/home/section-heading'
import { aboutContact, aboutUs, whyChooseTrading } from '@/lib/content/site-content'
import { buildMetadata } from '@/lib/seo/metadata'
import { legacyPageMetadata } from '@/lib/seo/legacy-metadata'
import { siteConfig } from '@/lib/site-config'

const harvested = legacyPageMetadata('/about-us/')

export const metadata: Metadata = buildMetadata({
  path: '/about-us/',
  title: harvested.title ?? `About ${siteConfig.name}`,
  titleMode: 'absolute',
  description:
    harvested.description ??
    'JAF Global Trading supplies premium home textiles and apparel essentials — bedding, bathrobes, towels, slippers, leggings and trousers — to homes, hotels and retailers.',
})

/**
 * The three page photographs, in the order the live About page runs them: a
 * billboard carrying the mark, a member of the team holding a JAF clipboard, and
 * a basket of parcels in front of a screen. Every one is the genuine asset from
 * the old storefront, not stock imagery.
 *
 * The source files are 700x1000, so the frames use the same 7:10 box and the
 * photograph is shown whole — no crop to explain away.
 */
const ABOUT_IMAGES = {
  billboard: {
    src: '/images/content/about-billboard.webp',
    alt: 'A JAF Trading billboard mounted above a city street',
  },
  team: {
    src: '/images/content/about-team.webp',
    alt: 'A JAF Trading team member holding a branded clipboard',
  },
  shopping: {
    src: '/images/content/about-shopping.webp',
    alt: 'A basket of parcels in front of an online storefront',
  },
}

/** One portrait photograph in the brand's frame. */
function AboutFigure({ image, sizes }: { image: { src: string; alt: string }; sizes: string }) {
  return (
    <figure className="relative aspect-[7/10] overflow-hidden rounded-2xl border border-border bg-cream">
      <Image src={image.src} alt={image.alt} fill sizes={sizes} quality={82} className="object-cover" />
    </figure>
  )
}

/** About page: the live copy, laid out as the live page lays it out. */
export default function AboutUsPage() {
  return (
    <>
      <PageBanner
        title="About Us"
        trail={[{ label: 'Home', href: '/' }, { label: 'About Us' }]}
        image={{ src: '/images/brand/about-banner.webp', alt: '' }}
      />

      <div className="container-page py-12 lg:py-16">
        {/* Who we are — copy beside the billboard photograph. */}
        <section aria-label={aboutUs.heading} className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading title={aboutUs.heading} highlight="are?" uppercase />
            <div className="mt-7 space-y-5 text-base leading-relaxed text-ink-soft">
              {aboutUs.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 28)}>{paragraph}</p>
              ))}
            </div>
          </div>

          <AboutFigure image={ABOUT_IMAGES.billboard} sizes="(min-width: 1024px) 46vw, 92vw" />
        </section>

        {/* Why choose — the team photograph beside the five published points. */}
        <section className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <AboutFigure image={ABOUT_IMAGES.team} sizes="(min-width: 1024px) 46vw, 92vw" />

          <div>
            <SectionHeading title="Why Choose JAF Trading" highlight="Trading" />
            <ul className="mt-7 space-y-5">
              {whyChooseTrading.map((point) => (
                <li key={point.title} className="flex gap-3">
                  <span className="shrink-0 text-base leading-6" aria-hidden>
                    {point.icon}
                  </span>
                  <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
                    <span className="font-semibold text-navy">{point.title}: </span>
                    {point.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact — the live page's own closing copy beside the shop basket. */}
        <section className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading title={aboutContact.heading} highlight="Us" />
            <div className="mt-7 space-y-5 text-base leading-relaxed text-ink-soft">
              {aboutContact.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 28)}>{paragraph}</p>
              ))}
            </div>
          </div>

          <AboutFigure image={ABOUT_IMAGES.shopping} sizes="(min-width: 1024px) 46vw, 92vw" />
        </section>
      </div>
    </>
  )
}
