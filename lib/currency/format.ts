/**
 * Pure formatting helpers shared by the server and the client price components.
 *
 * Amounts are always stored and passed around in PKR; conversion only happens at
 * the moment of display, and converted figures are marked as approximate so they
 * are never mistaken for the agreed price.
 */

import { siteConfig, type CurrencyCode } from '@/lib/site-config'

export const CURRENCY_META: Record<CurrencyCode, { label: string; decimals: number }> = {
  PKR: { label: 'Pakistani Rupee', decimals: 0 },
  USD: { label: 'US Dollar', decimals: 2 },
  EUR: { label: 'Euro', decimals: 2 },
  AUD: { label: 'Australian Dollar', decimals: 2 },
  GBP: { label: 'Pound Sterling', decimals: 2 },
}

export const supportedCurrencies: CurrencyCode[] = [...siteConfig.currency.supported]

export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
  return Boolean(value) && supportedCurrencies.includes(value as CurrencyCode)
}

/**
 * Formats an amount. Uses the ISO code as the display symbol so a figure can
 * never be misread as a different currency's local price.
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const { decimals } = CURRENCY_META[currency]
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Converts a canonical PKR amount for display.
 *
 * Returns `undefined` when no usable rate exists — callers then keep showing the
 * PKR figure rather than a wrong or `NaN` one.
 */
export function convertFromPKR(
  amountPKR: number,
  currency: CurrencyCode,
  rates: Partial<Record<CurrencyCode, number>> | undefined,
): number | undefined {
  if (!Number.isFinite(amountPKR)) return undefined
  if (currency === 'PKR') return amountPKR

  const rate = rates?.[currency]
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return undefined

  return roundTo(amountPKR * rate, CURRENCY_META[currency].decimals)
}

export type FormattedPrice = {
  text: string
  currency: CurrencyCode
  /** True when the figure is a display-only conversion of the PKR price. */
  converted: boolean
}

/** Formats a canonical PKR amount in the requested currency, with PKR fallback. */
export function formatPricePKR(
  amountPKR: number,
  currency: CurrencyCode,
  rates: Partial<Record<CurrencyCode, number>> | undefined,
): FormattedPrice {
  const converted = convertFromPKR(amountPKR, currency, rates)
  if (converted === undefined || currency === 'PKR') {
    return { text: formatCurrency(amountPKR, 'PKR'), currency: 'PKR', converted: false }
  }
  return { text: `≈ ${formatCurrency(converted, currency)}`, currency, converted: true }
}
