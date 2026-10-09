'use client'

import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { CurrencySelector } from '@/components/currency/currency-selector'
import { primaryNav } from '@/lib/content/navigation'
import { siteConfig } from '@/lib/site-config'
import { generalEnquiryUrl } from '@/lib/whatsapp'

/**
 * Mobile navigation: a modal drawer with the same real category tree as the
 * desktop menu. Radix handles focus trapping, Escape and scroll locking.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="btn inline-flex size-10 items-center justify-center border border-border text-ink transition-colors duration-200 hover:border-border-strong hover:text-navy lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-navy-deep/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-70 flex w-[min(22rem,88vw)] flex-col bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="text-xs font-medium tracking-[0.18em] text-navy uppercase">Menu</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="btn inline-flex size-9 items-center justify-center text-ink transition-colors duration-200 hover:text-terracotta"
                aria-label="Close menu"
              >
                <X className="size-5" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <form action="/shop/" method="get" role="search" className="mb-6">
              <label htmlFor="mobile-search" className="sr-only">
                Search products
              </label>
              <input
                id="mobile-search"
                type="search"
                name="q"
                placeholder="Search products"
                className="w-full rounded-xs border border-border bg-surface-muted px-3 py-2.5 text-sm text-ink placeholder:text-muted/80 focus:border-border-strong focus:outline-none"
              />
            </form>

            <nav aria-label="Mobile">
              <ul className="space-y-1">
                {primaryNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xs px-2 py-2.5 text-sm font-medium tracking-[0.12em] text-navy uppercase transition-colors duration-200 hover:bg-surface-muted"
                    >
                      {item.label}
                    </Link>
                    {item.children ? (
                      <ul className="mb-2 ml-3 space-y-0.5 border-l border-border pl-3">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className="block py-2 text-sm text-ink-soft transition-colors duration-200 hover:text-terracotta"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-[0.6875rem] tracking-[0.16em] text-muted uppercase">Display currency</p>
              <div className="mt-3">
                <CurrencySelector />
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5 text-sm text-ink-soft">
              <a href={`tel:${siteConfig.contact.phoneE164}`} className="block py-1 hover:text-terracotta">
                {siteConfig.contact.phoneDisplay}
              </a>
              <a href={`mailto:${siteConfig.contact.emails.general}`} className="block py-1 hover:text-terracotta">
                {siteConfig.contact.emails.general}
              </a>
              <p className="mt-2 text-muted">{siteConfig.contact.address.display}</p>
            </div>
          </div>

          <div className="border-t border-border p-5">
            <a
              href={generalEnquiryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="btn flex items-center justify-center bg-whatsapp px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-whatsapp-dark"
            >
              Enquire on WhatsApp
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
