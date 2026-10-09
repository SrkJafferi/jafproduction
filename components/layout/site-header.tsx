'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, ShoppingBag } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { CurrencySelector } from '@/components/currency/currency-selector'
import { MobileNav } from '@/components/layout/mobile-nav'
import { primaryNav } from '@/lib/content/navigation'
import { siteConfig } from '@/lib/site-config'

/**
 * Header restored to the original JAF Global Trading construction:
 *
 * - one white bar, no separate utility strip
 * - logo + wordmark lockup on the left
 * - uppercase Jost nav with the live site's exact labels, dropdowns preserved
 * - orange text on hover, matching the original's accent treatment
 * - a quiet bag icon (links to the catalogue, mirroring the original's
 *   silhouette so the bar reads the same) plus search and the currency switch
 *
 * No cart page, no account, no login — the bag icon simply opens the catalogue.
 *
 * On the homepage the bar is transparent and the hero is pulled up beneath it,
 * so the logo, menu, search, currency and bag all read over the artwork. The
 * header is back to solid white — as it is on every other page — the moment the
 * page scrolls: once the photograph is moving under the bar there is no wash
 * that keeps nav text legible over it.
 */

/** Routes whose opening screen is artwork the bar should sit over. */
const overlayRoutes = new Set(['/'])

/** Past this many pixels the artwork is moving under the bar, so it goes solid. */
const solidAt = 12

const subscribeScroll = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

const readScrolled = () => window.scrollY > solidAt

/**
 * Server and first paint read as "at the top". The route is known at render
 * time, so the homepage comes back transparent on the very first frame instead
 * of flashing a white bar and then correcting itself.
 */
const readScrolledOnServer = () => false

export function SiteHeader() {
  const pathname = usePathname()
  const scrolled = useSyncExternalStore(subscribeScroll, readScrolled, readScrolledOnServer)
  const overHero = overlayRoutes.has(pathname) && !scrolled

  return (
    <header
      // Lets the hero know artwork is behind the bar without a second source of truth.
      data-over-hero={overHero ? '' : undefined}
      className={`sticky top-0 z-50 h-16 border-b transition-colors duration-300 lg:h-[4.5rem] ${
        overHero ? 'border-transparent bg-transparent' : 'border-border bg-white'
      }`}
    >
      {/* At `lg` the bar carries the logo, the full menu, search, currency and
          the bag at once, and the row used to run 27px past a 1024px viewport.
          Tightening the gaps there — and only there — keeps every control on
          screen instead of buying room by dropping one. */}
      <div className="container-page flex h-full items-center gap-4 sm:gap-6 lg:gap-5 xl:gap-9">
        <MobileNav />

        {/* The logo and the controls each take an equal share of the free space
            (`flex-1` carries a zero basis), so the menu between them lands dead
            centre in the bar instead of hugging the logo. */}
        <div className="flex flex-1 items-center">
          {/* Logo — the original header pairs the mark with "JAF GLOBAL TRADING"
              in tight navy caps; the real logo artwork already carries that. */}
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${siteConfig.name} — home`}>
            <Image
              src={siteConfig.media.logo}
              alt={siteConfig.name}
              width={444}
              height={171}
              priority
              sizes="120px"
              className="h-9 w-auto max-w-[36vw] object-contain sm:h-10 lg:h-11 lg:max-w-none"
            />
          </Link>
        </div>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-5 xl:gap-9">
            {primaryNav.map((item) => (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className="inline-flex items-center py-3 text-[0.8125rem] font-medium tracking-[0.08em] whitespace-nowrap text-ink uppercase transition-colors duration-200 hover:text-terracotta"
                >
                  {item.label}
                  {item.children ? <ChevronDown /> : null}
                </Link>

                {item.children ? (
                  <div className="invisible absolute top-full left-0 z-40 w-64 translate-y-1 border border-border bg-white py-2 opacity-0 shadow-card transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <ul>
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="block px-5 py-2 text-[0.8125rem] tracking-[0.04em] text-ink-soft uppercase transition-colors duration-200 hover:bg-surface-muted hover:text-terracotta"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2 lg:gap-3">
          <form action="/shop/" method="get" role="search" className="hidden items-center lg:flex">
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <span className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id="header-search"
                type="search"
                name="q"
                placeholder="Search towels, robes…"
                className="w-36 rounded-full border border-border bg-surface-muted py-2 pr-3 pl-8 text-sm text-ink transition-[width,border-color] duration-200 placeholder:text-muted/80 focus:w-48 focus:border-border-strong focus:outline-none xl:w-44"
              />
            </span>
          </form>

          {/* Wrapped rather than passed as `hidden md:inline-flex`: the button's
              own base `inline-flex` outranks a bare `hidden` in the compiled
              sheet, which used to keep the pill on phones and push the row past
              the viewport on ~280px screens. The drawer already carries a
              currency switch, so nothing is lost below `md`. */}
          <span className="hidden md:inline-flex">
            <CurrencySelector />
          </span>

          <Link
            href="/shop/"
            aria-label="View all products"
            className="inline-flex size-8 shrink-0 items-center justify-center text-ink transition-colors duration-200 hover:text-terracotta sm:size-9"
          >
            <ShoppingBag className="size-5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  )
}

/** The little chevron the live menu uses on parent items. */
function ChevronDown() {
  return (
    <svg
      viewBox="0 0 12 8"
      fill="none"
      className="ml-1 size-2.5 text-muted transition-transform duration-200 group-hover:rotate-180"
      aria-hidden="true"
    >
      <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
