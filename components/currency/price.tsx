'use client'

import { useCurrency } from '@/components/currency/currency-provider'
import { formatCurrency } from '@/lib/currency/format'

type PriceProps = {
  regularPricePKR?: number
  salePricePKR?: number
  className?: string
  /** Larger, roomier treatment for the product detail panel. */
  variant?: 'card' | 'detail'
  /** Rendered on the dark panels, where muted ink would be unreadable. */
  tone?: 'default' | 'onDark'
  /** Shows "Ask on WhatsApp" alongside the ask-for-price state. */
  showAskHint?: boolean
}

const ASK_LABEL = 'Ask for Price'

/**
 * Renders a product's price, or the honest "Ask for Price" state.
 *
 * The treatment mirrors the live cards: the sale figure in orange with the
 * regular price struck through beside it in grey. Products without a source
 * price are never shown as zero. The canonical PKR figure is always the last
 * thing a shopper sees; a conversion is marked with "≈" and never replaces it
 * on the product page.
 */
export function Price({
  regularPricePKR,
  salePricePKR,
  className,
  variant = 'card',
  tone = 'default',
  showAskHint = false,
}: PriceProps) {
  const { formatPKR } = useCurrency()
  const hasPrice = regularPricePKR !== undefined || salePricePKR !== undefined

  const detail = variant === 'detail'
  const saleClass = detail ? 'text-2xl font-medium sm:text-3xl' : 'text-[0.9375rem] font-medium'
  const regularClass = detail ? 'text-base' : 'text-sm'
  const mutedClass = tone === 'onDark' ? 'text-white/60' : 'text-muted'

  if (!hasPrice) {
    return (
      <span className={className}>
        <span className={`${saleClass} ${tone === 'onDark' ? 'text-white' : 'text-navy'}`}>{ASK_LABEL}</span>
        {showAskHint ? (
          <span className={`mt-1 block text-sm ${mutedClass}`}>Ask on WhatsApp — we confirm availability and pricing directly.</span>
        ) : null}
      </span>
    )
  }

  // The export sometimes lists a sale price with no regular price; the sale
  // figure is then the price, with no struck-through comparison to invent.
  const displaySale = salePricePKR ?? regularPricePKR!
  const showComparison = salePricePKR !== undefined && regularPricePKR !== undefined && regularPricePKR > salePricePKR

  const formattedSale = formatPKR(displaySale)
  const formattedRegular = showComparison ? formatPKR(regularPricePKR!) : undefined

  return (
    <span className={className}>
      <span className="flex flex-wrap items-baseline gap-x-2">
        {/* Orange sale price, exactly the live store's treatment. */}
        <span className={`${saleClass} ${tone === 'onDark' ? 'text-white' : 'text-terracotta'}`}>{formattedSale.text}</span>
        {formattedRegular ? (
          <del className={`${regularClass} ${mutedClass}`}>
            <span className="sr-only">Regular price </span>
            {formattedRegular.text}
          </del>
        ) : null}
      </span>
      {/* The canonical price stays visible whenever a conversion is shown. */}
      {formattedSale.converted ? (
        <span className={`mt-1 block text-xs ${mutedClass}`}>
          Converted from {formatCurrency(displaySale, 'PKR')} — indicative only, confirmed in PKR
        </span>
      ) : null}
    </span>
  )
}
