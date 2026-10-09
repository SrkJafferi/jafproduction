'use client'

import { useCurrency } from '@/components/currency/currency-provider'
import { WhatsAppGlyph } from '@/components/whatsapp/whatsapp-float'
import { effectivePricePKR, hasPrice, type PriceFields } from '@/lib/catalogue/pricing'
import { formatCurrency } from '@/lib/currency/format'
import { siteConfig } from '@/lib/site-config'
import { productEnquiryUrl } from '@/lib/whatsapp'
import type { Product } from '@/types/catalogue'

type WhatsAppEnquiryProps = {
  product: Pick<Product, 'name' | 'slug' | 'sku'> & PriceFields
  variant?: 'primary' | 'outline' | 'quiet'
  label?: string
  className?: string
}

/**
 * The product enquiry CTA.
 *
 * The message carries the price the visitor is actually looking at plus the
 * canonical PKR figure, so nobody can mistake a converted number for the agreed
 * one. For unpriced products the message simply asks for the price.
 */
export function WhatsAppEnquiry({ product, variant = 'primary', label, className }: WhatsAppEnquiryProps) {
  const { formatPKR } = useCurrency()

  // Computed during render: the server and the first client render agree on PKR,
  // and the href follows the visitor's currency on later passes.
  const href = buildHref(product, formatPKR)

  const styles: Record<NonNullable<WhatsAppEnquiryProps['variant']>, string> = {
    primary:
      'btn inline-flex items-center justify-center gap-2 bg-terracotta px-5 py-3 text-sm font-medium tracking-wide text-white transition-colors duration-200 hover:bg-terracotta-dark',
    outline:
      'btn inline-flex items-center justify-center gap-2 border border-navy/25 px-5 py-3 text-sm font-medium tracking-wide text-navy transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-cream',
    quiet:
      'inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.12em] text-navy uppercase transition-colors duration-200 hover:text-terracotta',
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles[variant]} ${className ?? ''}`}
      aria-label={`Ask about ${product.name} on WhatsApp`}
    >
      <WhatsAppGlyph className="size-4 shrink-0" />
      {label ?? (hasPrice(product) ? 'Enquire on WhatsApp' : 'Ask on WhatsApp')}
    </a>
  )
}

function buildHref(
  product: Pick<Product, 'name' | 'slug' | 'sku'> & PriceFields,
  formatPKR: (amountPKR: number) => { text: string; converted: boolean },
): string {
  const price = effectivePricePKR(product)
  const base = price.amount !== undefined ? formatCurrency(price.amount, 'PKR') : undefined
  const displayed = price.amount !== undefined ? formatPKR(price.amount).text : undefined

  return productEnquiryUrl({
    productName: product.name,
    productUrl: `${siteConfig.url}/product/${product.slug}/`,
    sku: product.sku,
    displayedPrice: displayed,
    basePricePKR: base,
  })
}
