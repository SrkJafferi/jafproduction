'use client'

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import { siteConfig, type CurrencyCode } from '@/lib/site-config'
import { formatPricePKR, isCurrencyCode, type FormattedPrice } from '@/lib/currency/format'

const STORAGE_KEY = 'jaf.currency'

type RateMap = Partial<Record<CurrencyCode, number>>
export type RatesStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

type CurrencyState = {
  currency: CurrencyCode
  rates: RateMap | undefined
  status: RatesStatus
}

export type CurrencyContextValue = CurrencyState & {
  setCurrency: (currency: CurrencyCode) => void
  /** Fetches the rate feed if it is not already loaded; safe to call repeatedly. */
  loadRates: () => void
  /** Formats a canonical PKR amount for the active currency. */
  formatPKR: (amountPKR: number) => FormattedPrice
}

/**
 * Currency is held in a tiny external store rather than component state.
 *
 * `useSyncExternalStore` reports PKR on the server *and* during hydration, then
 * the stored preference on the following pass — so there is no hydration
 * mismatch and no cascading state update from an effect. Rates are fetched at
 * most once per page view, and only when a non-PKR currency is actually in play.
 */
const SERVER_STATE: CurrencyState = {
  currency: siteConfig.currency.default,
  rates: undefined,
  status: 'idle',
}

let snapshot: CurrencyState = SERVER_STATE
const listeners = new Set<() => void>()

function update(patch: Partial<CurrencyState>): void {
  snapshot = { ...snapshot, ...patch }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // A change in another tab should be reflected here too.
  window.addEventListener('storage', onStorageChange)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorageChange)
  }
}

let refreshTimer: number | undefined

function onStorageChange(): void {
  // Re-reads localStorage through getSnapshot on the next notification.
  refresh()
}

function refresh(): void {
  if (refreshTimer !== undefined) return
  refreshTimer = window.setTimeout(() => {
    refreshTimer = undefined
    update({})
  }, 0)
}

function readStoredCurrency(): CurrencyCode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isCurrencyCode(stored) ? stored : siteConfig.currency.default
  } catch {
    return siteConfig.currency.default
  }
}

function getSnapshot(): CurrencyState {
  // Keep the cache in step with the persisted preference. The returned object
  // only changes identity when the currency actually changes.
  const stored = readStoredCurrency()
  if (stored !== snapshot.currency) snapshot = { ...snapshot, currency: stored }
  return snapshot
}

function getServerSnapshot(): CurrencyState {
  return SERVER_STATE
}

type RatesPayload = { available?: boolean; rates?: RateMap }

let ratesRequest: Promise<RateMap | undefined> | undefined

/** Loads the display rates once; failures leave the site on PKR. */
export function loadRates(): void {
  if (snapshot.rates || ratesRequest) return

  // The site runs with trailing slashes, so the canonical route path ends in one.
  ratesRequest = fetch('/api/exchange-rates/', { headers: { accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
    .then((payload: RatesPayload) => (payload.available ? payload.rates : undefined))
    .catch(() => undefined)
    .then((rates) => {
      if (rates) update({ rates, status: 'ready' })
      else update({ status: 'unavailable' })
      return rates
    })
}

export function setCurrency(currency: CurrencyCode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, currency)
  } catch {
    /* private mode: the choice simply does not persist */
  }
  update({ currency })
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Warm the rate feed when a non-PKR currency is in play. The fetched value is
  // applied asynchronously inside the store, never from this effect body.
  useEffect(() => {
    if (state.currency !== siteConfig.currency.base) loadRates()
  }, [state.currency])

  const value = useMemo<CurrencyContextValue>(
    () => ({
      ...state,
      setCurrency,
      loadRates,
      formatPKR: (amountPKR: number) => formatPricePKR(amountPKR, state.currency, state.rates),
    }),
    [state],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error('useCurrency must be used inside <CurrencyProvider>')
  return context
}
