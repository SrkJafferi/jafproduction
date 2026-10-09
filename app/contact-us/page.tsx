import type { Metadata } from 'next'
import Image from 'next/image'
import { Clock, Leaf, Mail, MapPin, Phone, ShieldCheck, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { SectionHeading } from '@/components/home/section-heading'
import { SocialGlyph } from '@/components/layout/social-icons'
import { ContactForm } from '@/components/whatsapp/contact-form'
import { contactPage, whyChooseGlobal } from '@/lib/content/site-content'
import { buildMetadata } from '@/lib/seo/metadata'
import { legacyPageMetadata } from '@/lib/seo/legacy-metadata'
import { breadcrumbJsonLd, organisationJsonLd } from '@/lib/seo/json-ld'
import { siteConfig } from '@/lib/site-config'

const harvested = legacyPageMetadata('/contact-us/')

export const metadata: Metadata = buildMetadata({
  path: '/contact-us/',
  title: harvested.title ?? `Contact Us | ${siteConfig.name}`,
  titleMode: 'absolute',
  description:
    harvested.description ??
    `Contact JAF Global Trading in ${siteConfig.contact.address.display} for retail, wholesale and B2B enquiries: ${siteConfig.contact.phoneDisplay}.`,
})

/**
 * One detail card: a soft terracotta disc, then the label and its value. Laid out
 * two-up on wide screens, which is how the design groups the four facts.
 */
function DetailCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-card">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-terracotta/12 text-terracotta"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.9375rem] font-semibold text-navy">{label}</p>
        <div className="mt-1 flex flex-col gap-0.5 text-sm leading-relaxed text-ink-soft">{children}</div>
      </div>
    </div>
  )
}

/**
 * The three closing cards. Their copy is `whyChooseGlobal` — the live page's own
 * paragraphs — and the headings name what each one is about.
 */
const CLOSING_CARDS: Array<{ title: string; icon: ReactNode }> = [
  { title: 'A People-First Company', icon: <UsersRound className="size-5" /> },
  { title: 'Safe, Thoughtful & Reliable', icon: <Leaf className="size-5" /> },
  { title: 'Lasting Comfort, Real Value', icon: <ShieldCheck className="size-5" /> },
]

export default function ContactUsPage() {
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Contact Us' },
  ]

  const closingParagraphs = whyChooseGlobal.slice(1)

  return (
    <>
      {/* Warm hero: the page's own heading beside a stack of JAF towels. */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-linear-to-br from-[#fbf3ea] via-[#fdeee1] to-[#f8ddc7]" aria-hidden />

        <div className="relative container-page py-8 lg:py-12">
          <Breadcrumbs trail={trail} />

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12">
            <div>
              <p className="eyebrow">We are here to help</p>
              <h1 className="mt-3 text-[2.25rem] leading-tight font-bold text-navy sm:text-[2.75rem]">
                {contactPage.heading}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">{contactPage.note}</p>
            </div>

            <div className="relative">
              <figure className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-white/70 bg-cream shadow-card">
                <Image
                  src="/images/content/contact-towels.webp"
                  alt="Folded JAF Global Trading bath towels stacked in cream, sage and blush"
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 92vw"
                  quality={82}
                  className="object-cover"
                />
              </figure>
              <p
                aria-hidden
                className="pointer-events-none absolute -bottom-3 -left-2 font-serif text-3xl leading-none italic text-navy/75 sm:text-4xl"
              >
                Comfort Connects Us
              </p>
            </div>
          </div>
        </div>

        {/* The brand line the design runs up the page edge. */}
        <div className="absolute inset-y-0 right-0 hidden w-14 items-center justify-center border-l border-navy/10 bg-cream/50 xl:flex">
          <p className="text-[0.625rem] font-medium tracking-[0.28em] text-navy/70 uppercase [writing-mode:vertical-rl]">
            Quality textiles for a brighter tomorrow
          </p>
        </div>
      </section>

      {/* Details and the enquiry form, side by side. */}
      <section className="container-page py-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailCard icon={<MapPin className="size-5" />} label="Address">
                <p>{siteConfig.contact.address.display}</p>
              </DetailCard>

              <DetailCard icon={<Phone className="size-5" />} label="Mobile">
                <a href={`tel:${siteConfig.contact.phoneE164}`} className="link-underline">
                  {siteConfig.contact.phoneDisplay}
                </a>
              </DetailCard>

              <DetailCard icon={<Mail className="size-5" />} label="Email">
                <a href={`mailto:${siteConfig.contact.emails.general}`} className="link-underline">
                  {siteConfig.contact.emails.general}
                </a>
                <a href={`mailto:${siteConfig.contact.emails.support}`} className="link-underline">
                  {siteConfig.contact.emails.support}
                </a>
              </DetailCard>

              <DetailCard icon={<Clock className="size-5" />} label="Business Hours">
                {siteConfig.hours.map((entry) => (
                  <span key={entry.days}>
                    {entry.days} · {entry.time}
                  </span>
                ))}
              </DetailCard>
            </div>

            <div className="mt-8">
              <h2 className="text-sm font-semibold text-navy">Follow Us</h2>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {siteConfig.socials.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${siteConfig.name} on ${social.label}`}
                      className="flex size-10 items-center justify-center rounded-full border border-border bg-white text-navy transition-colors duration-200 hover:border-terracotta hover:bg-terracotta hover:text-white"
                    >
                      <SocialGlyph label={social.label} className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-border">
              <iframe
                title={`Map showing ${siteConfig.name}'s location in ${siteConfig.contact.address.locality}`}
                src={siteConfig.contact.address.mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-72 w-full"
              />
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      {/* Closing band: the live page's own promise, then the three cards. */}
      <section className="border-t border-border bg-cream">
        <div className="container-page py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-14">
            <SectionHeading eyebrow="Before you write" title="Why Choose JAF Global Trading?" />
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{whyChooseGlobal[0]}</p>
          </div>

          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {CLOSING_CARDS.map((card, index) => (
              <li key={card.title} className="rounded-2xl border border-border bg-white p-6 shadow-card">
                <span
                  className="flex size-11 items-center justify-center rounded-full bg-terracotta/12 text-terracotta"
                  aria-hidden
                >
                  {card.icon}
                </span>
                <h3 className="mt-4 text-base font-semibold text-navy">{card.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">{closingParagraphs[index]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(trail.map((crumb) => ({ name: crumb.label, href: crumb.href ?? '/contact-us/' })))),
        }}
      />
    </>
  )
}
