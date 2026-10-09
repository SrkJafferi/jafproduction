import { NextResponse } from 'next/server'
import { EXCHANGE_RATE_TTL_SECONDS, getExchangeRates } from '@/lib/currency/rates'

/**
 * Small cached endpoint: one request per revalidation window, never one per
 * product. Rendering never waits on it — pages ship with PKR prices and the
 * browser asks for rates only when a visitor switches currency.
 */
// Route segment config must be a literal for Next to analyse it statically.
// Keep in sync with `EXCHANGE_RATE_TTL_SECONDS` in lib/currency/rates.ts (6h).
export const revalidate = 21600

export async function GET() {
  const rates = await getExchangeRates()

  return NextResponse.json(rates, {
    status: 200,
    headers: {
      'cache-control': `public, max-age=300, s-maxage=${EXCHANGE_RATE_TTL_SECONDS}, stale-while-revalidate=86400`,
    },
  })
}
