import type { Metadata, Viewport } from 'next'
import { Jost } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { ScrollToTop } from '@/components/layout/scroll-to-top'
import { SiteSmoothScroll } from '@/components/layout/site-smooth-scroll'
import { TrustBar } from '@/components/layout/trust-bar'
import { WhatsAppFloat } from '@/components/whatsapp/whatsapp-float'
import { CurrencyProvider } from '@/components/currency/currency-provider'
import { siteConfig } from '@/lib/site-config'
import { organisationJsonLd, websiteJsonLd } from '@/lib/seo/json-ld'

/** Brand sans — the same family (and weight range) the live storefront loads. */
const jost = Jost({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-jost',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.tagline} | ${siteConfig.name}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: 'en_US',
    url: '/',
    title: `${siteConfig.tagline} | ${siteConfig.name}`,
    description: siteConfig.description,
    images: [{ url: siteConfig.media.ogImage, width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.tagline} | ${siteConfig.name}`,
    description: siteConfig.description,
    images: [siteConfig.media.ogImage],
  },
  icons: {
    icon: [{ url: siteConfig.media.logo, type: 'image/webp' }],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#08284b',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jost.variable} data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col bg-surface text-ink">
        <CurrencyProvider>
          {/* Momentum wheel scrolling. Renders nothing — it only owns the Lenis
              instance, which the back-to-top button and in-page anchors drive. */}
          <SiteSmoothScroll />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          {/* The four service promises sit above the footer on every page, so the
              closing band of the site is the same wherever a visitor lands. */}
          <TrustBar />
          <SiteFooter />
          <WhatsAppFloat />
          <ScrollToTop />
        </CurrencyProvider>
        <script
          type="application/ld+json"
          // Static, build-time JSON-LD built from configuration only.
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organisationJsonLd(), websiteJsonLd()]) }}
        />
      </body>
    </html>
  )
}
