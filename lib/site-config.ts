/**
 * Single source of truth for business identity, contact details and the
 * currency list.
 *
 * Every value here was harvested from the live site during the audit — nothing
 * is invented, and nothing is duplicated inside components.
 */

export type CurrencyCode = 'PKR' | 'USD' | 'EUR' | 'AUD' | 'GBP'

export const SITE_URL = 'https://jaftradings.com'

export const siteConfig = {
  name: 'JAF Global Trading',
  /** Used where space is tight: header wordmark fallback, JSON-LD alternateName. */
  shortName: 'JAF Trading',
  url: SITE_URL,
  /** From the live homepage title — "Luxury Bath Towels, Bathrobes & Bedding". */
  tagline: 'Luxury Bath Towels, Bathrobes & Bedding',
  /** The live meta description, kept verbatim for SEO continuity. */
  description:
    'Shop premium luxury bath towels, bathrobes, bedding & hair turbans at JAF Global Trading. 100% cotton, hypoallergenic, sustainably produced. B2B & B2C wholesale available.',
  contact: {
    /** Exactly as printed on the live contact page. */
    phoneDisplay: '+92 321-840-7252',
    phoneE164: '+923218407252',
    /** Digits only — the WhatsApp `wa.me` path. */
    whatsapp: '923218407252',
    emails: {
      general: 'info@jaftradings.com',
      support: 'support@jaftradings.com',
    },
    address: {
      locality: 'Karachi',
      country: 'Pakistan',
      /** ISO 3166-1 alpha-2, for the PostalAddress structured data. */
      countryCode: 'PK',
      display: 'Karachi - Pakistan',
      /** Google Maps embed used by the live site (contact page query). */
      mapEmbed: 'https://maps.google.com/maps?q=Karachi&t=m&z=16&output=embed',
      /** The storefront uses a broader query on the homepage. */
      mapEmbedBusiness: 'https://maps.google.com/maps?q=jaf%20global%20trading&t=m&z=16&output=embed',
    },
  },
  /** Opening hours exactly as published in the live footer. */
  hours: [
    { days: 'Monday – Friday', time: '08:00 – 20:00' },
    { days: 'Saturday', time: '09:00 – 21:00' },
    { days: 'Sunday', time: '13:00 – 22:00' },
  ],
  socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/jafglobaltrading/' },
    { label: 'Instagram', href: 'https://www.instagram.com/jafglobaltrading/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/jaftradings/' },
    { label: 'YouTube', href: 'https://youtube.com/@JAFGlobalTrading' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@jaftradings' },
  ],
  /** The three brand banners and hero film that ship with the site. */
  media: {
    logo: '/images/brand/jaftrading-logo.webp',
    ogImage: '/images/brand/og-default.webp',
    heroVideo: '/videos/hero-banner.mp4',
    productPlaceholder: '/images/placeholders/product-placeholder.webp',
  },
  currency: {
    /** PKR is the canonical stored price. Conversions are display-only. */
    base: 'PKR' as CurrencyCode,
    default: 'PKR' as CurrencyCode,
    supported: ['PKR', 'USD', 'EUR', 'AUD', 'GBP'] as CurrencyCode[],
  },
} as const

export type SiteConfig = typeof siteConfig
