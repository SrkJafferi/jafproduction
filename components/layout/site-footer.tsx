import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Bath,
  BedDouble,
  BedSingle,
  CalendarDays,
  ChevronRight,
  HelpCircle,
  Home,
  Info,
  Layers,
  Mail,
  MapPin,
  PersonStanding,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Shirt,
  Sparkles,
  Tag,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TrousersIcon } from '@/components/catalogue/trousers-icon'
import { NewsletterSignup } from '@/components/layout/newsletter-signup'
import { SocialGlyph } from '@/components/layout/social-icons'
import { footerNav, primaryNav } from '@/lib/content/navigation'
import { siteConfig } from '@/lib/site-config'

/**
 * The premium footer: a warm cream band carrying a spa still-life photograph on
 * the right, the brand column, the Quick Links and Customer Service menus, and
 * the newsletter + service-hours column — closed by the navy copyright bar.
 *
 * Payment marks are typographic chips rather than card-brand artwork: the project
 * ships no licensed logo assets, and a text chip is honest about that.
 */
const PAYMENT_METHODS = ['VISA', 'Mastercard', 'easypaisa', 'jazzcash']

const FOOTER_BACKGROUND = '/images/brand/footer-spa-still-life.avif'

/**
 * A glyph per menu entry, keyed by the label the navigation data carries. Those
 * labels come from the audited menu, so they are stable; anything unrecognised
 * falls back to a neutral tag rather than leaving a blank slot.
 */
const MENU_ICONS: Record<string, LucideIcon> = {
  // Quick Links
  Home: Home,
  'Our Products': ShoppingBag,
  Bath: Bath,
  Bedding: BedDouble,
  // lucide has no trousers mark, so this one is drawn locally.
  Trousers: TrousersIcon as unknown as LucideIcon,
  Leggings: PersonStanding,
  // Customer Service
  'Contact Us': Phone,
  'About Us': Info,
  'Hair Wrap Turban': Sparkles,
  'Bath Towels': Waves,
  Bathrobes: Shirt,
  'Sheet & Pillow Covers': BedSingle,
  'Blankets & Throws': Layers,
  FAQs: HelpCircle,
}

/** A footer column title with the short terracotta rule the design uses. */
function ColumnHeading({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2 className="text-[1.0625rem] font-semibold text-navy">{children}</h2>
      <span aria-hidden className="mt-2.5 block h-0.5 w-10 bg-terracotta" />
    </div>
  )
}

/** One menu column: an icon and label per row, a chevron that nudges on hover. */
function FooterMenu({ heading, links }: { heading: string; links: Array<{ label: string; href: string }> }) {
  return (
    <nav aria-label={heading}>
      <ColumnHeading>{heading}</ColumnHeading>
      <ul className="mt-4 divide-y divide-border">
        {links.map((link) => {
          const Icon = MENU_ICONS[link.label] ?? Tag
          return (
            <li key={`${heading}-${link.href}`}>
              <Link
                href={link.href}
                className="group flex items-center gap-2 py-2.5 text-[0.9375rem] text-ink-soft transition-colors duration-200 hover:text-terracotta"
              >
                <Icon
                  className="size-3.5 shrink-0 text-navy/45 transition-colors duration-200 group-hover:text-terracotta"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">{link.label}</span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-terracotta"
                  aria-hidden
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-cream">
      {/* Spa still-life behind the right-hand side of the band. Below lg the
          columns stack full-width, so the photograph would sit under the copy —
          it is shown only from lg up, where it has its own strip. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-cover bg-right-bottom bg-no-repeat lg:block"
        style={{ backgroundImage: `url('${FOOTER_BACKGROUND}')` }}
      />
      {/* Cream wash so the copy stays legible while the photograph shows through
          on the right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-cream via-cream/80 to-transparent"
      />

      {/* The trailing spacer column is what keeps the copy clear of the towel
          still-life — the design gives the photograph its own strip on the right. */}
      <div className="container-page relative grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.6fr_0.8fr_1.4fr_0fr] lg:gap-12 xl:gap-16">
        {/* Brand column */}
        <div>
          <Image
            src={siteConfig.media.logo}
            alt={siteConfig.name}
            width={444}
            height={171}
            sizes="150px"
            className="h-12 w-auto"
          />
          <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-ink-soft">
            Step into a world of comfort and elegance with premium home textiles designed for every occasion. Whether
            you&rsquo;re relaxing at home, enjoying a warm bath, or looking for something chic for a night out, our
            products add a touch of luxury to your routine.
          </p>

          <ul className="mt-6 space-y-3 text-[0.9375rem] text-ink-soft">
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-navy" aria-hidden />
              <a
                href={`tel:${siteConfig.contact.phoneE164}`}
                className="transition-colors duration-200 hover:text-terracotta"
              >
                {siteConfig.contact.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-navy" aria-hidden />
              <a
                href={`mailto:${siteConfig.contact.emails.general}`}
                className="transition-colors duration-200 hover:text-terracotta"
              >
                {siteConfig.contact.emails.general}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-navy" aria-hidden />
              <span>{siteConfig.contact.address.display}</span>
            </li>
          </ul>

          <ul className="mt-6 flex flex-wrap gap-2.5">
            {siteConfig.socials.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-navy/20 text-navy transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white"
                >
                  <SocialGlyph label={social.label} className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links — the main menu, as the design repeats it. */}
        <FooterMenu heading="Quick Links" links={primaryNav} />

        {/* Customer Service */}
        {footerNav.map((group) => (
          <FooterMenu key={group.heading} heading={group.heading} links={group.links} />
        ))}

        {/* Newsletter + service hours */}
        <div>
          <ColumnHeading>Stay Updated</ColumnHeading>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">
            Subscribe to our newsletter for the latest updates, new arrivals and exclusive offers.
          </p>
          <NewsletterSignup />

          <div className="mt-9">
            <ColumnHeading>Customer Service Hours</ColumnHeading>
            <ul className="mt-4 divide-y divide-border">
              {siteConfig.hours.map((entry) => (
                <li
                  key={entry.days}
                  className="flex items-center justify-between gap-4 py-2.5 text-[0.9375rem] text-ink-soft"
                >
                  <span className="flex items-center gap-2.5">
                    <CalendarDays className="size-4 shrink-0 text-navy" aria-hidden />
                    {entry.days}
                  </span>
                  <span className="text-navy">{entry.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Breathing room so the columns never run into the towel still-life. */}
        <div aria-hidden className="hidden lg:block" />
      </div>

      {/* Navy copyright bar. */}
      <div className="relative bg-navy">
        <div className="container-page flex flex-col items-center gap-4 py-4 text-center text-xs text-cream/75 lg:flex-row lg:justify-between lg:text-left">
          <p>© {new Date().getFullYear()} JAF Global Trading. All Rights Reserved.</p>

          <ul className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_METHODS.map((method) => (
              <li
                key={method}
                className="rounded bg-white px-2 py-1 text-[0.625rem] font-semibold tracking-[0.04em] text-navy"
              >
                {method}
              </li>
            ))}
            <li className="flex items-center gap-1.5 pl-1 text-cream/70">
              <ShieldCheck className="size-4" aria-hidden />
              Secure checkout
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
