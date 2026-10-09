/**
 * Exchange rates, fetched server-side and cached.
 *
 * PKR is the canonical price currency and is never converted away from, so the
 * rate lookup is strictly an enhancement: if every provider is unreachable the
 * site still renders correct PKR prices and the other currencies are simply
 * disabled instead of showing a guessed number.
 *
 * Note: the previous plan named Frankfurter as the provider, but it does not
 * publish PKR at all (`GET /v1/latest?base=PKR` answers "not found"), so the rate
 * feed is taken from providers that genuinely quote PKR.
 */

import { siteConfig, type CurrencyCode } from '@/lib/site-config'

export const EXCHANGE_RATE_TTL_SECONDS = 6 * 60 * 60

export type ExchangeRates = {
  base: 'PKR'
  updatedAt: string
  available: boolean
  /** Value of one PKR in the target currency, plus PKR itself at 1. */
  rates: Partial<Record<CurrencyCode, number>>
  source: string
}

type Provider = {
  name: string
  url: string
  parse: (payload: unknown) => Partial<Record<string, number>>
}

const PROVIDERS: Provider[] = [
  {
    name: 'open.er-api.com',
    url: 'https://open.er-api.com/v6/latest/PKR',
    parse: (payload) => {
      const rates = (payload as { rates?: Record<string, number> })?.rates
      return rates ?? {}
    },
  },
  {
    name: 'currency-api',
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/pkr.json',
    parse: (payload) => {
      const rates = (payload as { pkr?: Record<string, number> })?.pkr
      if (!rates) return {}
      return Object.fromEntries(Object.entries(rates).map(([code, value]) => [code.toUpperCase(), value]))
    },
  },
]

/**
 * Plausibility window for "one PKR in X" during the 2020s. A provider that
 * returns something outside this window is rejected rather than displayed.
 */
const SANITY: Record<Exclude<CurrencyCode, 'PKR'>, [number, number]> = {
  USD: [0.001, 0.02],
  EUR: [0.0008, 0.02],
  AUD: [0.001, 0.03],
  GBP: [0.0008, 0.02],
}

const TARGETS = siteConfig.currency.supported.filter((code): code is Exclude<CurrencyCode, 'PKR'> => code !== 'PKR')

const UNAVAILABLE: ExchangeRates = {
  base: 'PKR',
  updatedAt: new Date(0).toISOString(),
  available: false,
  rates: { PKR: 1 },
  source: 'unavailable',
}

async function fetchProvider(provider: Provider): Promise<Partial<Record<CurrencyCode, number>> | undefined> {
  try {
    const response = await fetch(provider.url, {
      signal: AbortSignal.timeout(5000),
      headers: { accept: 'application/json' },
      next: { revalidate: EXCHANGE_RATE_TTL_SECONDS, tags: ['exchange-rates'] },
    })
    if (!response.ok) return undefined
    const payload: unknown = await response.json()
    const raw = provider.parse(payload)

    const rates: Partial<Record<CurrencyCode, number>> = { PKR: 1 }
    for (const target of TARGETS) {
      const value = raw[target]
      const [min, max] = SANITY[target]
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
        return undefined
      }
      rates[target] = value
    }
    return rates
  } catch {
    return undefined
  }
}

/** Cached for six hours; falls back to PKR-only when no provider answers. */
export async function getExchangeRates(): Promise<ExchangeRates> {
  for (const provider of PROVIDERS) {
    const rates = await fetchProvider(provider)
    if (rates) {
      return {
        base: 'PKR',
        updatedAt: new Date().toISOString(),
        available: true,
        rates,
        source: provider.name,
      }
    }
  }
  return UNAVAILABLE
}
