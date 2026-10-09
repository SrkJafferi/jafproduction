'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { useCurrency } from '@/components/currency/currency-provider'
import { CURRENCY_META, supportedCurrencies } from '@/lib/currency/format'
import { siteConfig } from '@/lib/site-config'

type CurrencySelectorProps = {
  /** The utility bar sits on navy, so the trigger is inverted there. */
  tone?: 'default' | 'onDark'
  className?: string
}

export function CurrencySelector({ tone = 'default', className }: CurrencySelectorProps) {
  const { currency, setCurrency, loadRates, status } = useCurrency()
  const ratesUnavailable = status === 'unavailable'

  const triggerTone =
    tone === 'onDark'
      ? 'text-cream/90 hover:text-cream border-cream/25 hover:border-cream/45'
      : 'text-ink-soft hover:text-navy border-border hover:border-border-strong'

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        // Only reach for the rate feed once someone actually shows interest.
        if (open) loadRates()
      }}
    >
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Display currency: ${currency}. Change currency`}
          className={`inline-flex items-center gap-1.5 btn border px-2.5 py-1.5 text-xs font-medium tracking-[0.14em] uppercase transition-colors duration-200 ${triggerTone} ${className ?? ''}`}
        >
          {currency}
          <ChevronDown className="size-3.5" aria-hidden />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 rounded-md border border-border bg-surface p-1.5 shadow-card"
        >
          <p className="px-3 py-2 text-[0.6875rem] tracking-[0.16em] text-muted uppercase">Display currency</p>

          <DropdownMenu.RadioGroup
            value={currency}
            onValueChange={(value) => {
              if (ratesUnavailable && value !== siteConfig.currency.base) return
              setCurrency(value as typeof currency)
            }}
          >
            {supportedCurrencies.map((code) => {
              const disabled = ratesUnavailable && code !== siteConfig.currency.base
              return (
                <DropdownMenu.RadioItem
                  key={code}
                  value={code}
                  disabled={disabled}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xs px-3 py-2 text-sm outline-none transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-highlighted:bg-surface-muted"
                >
                  <span className="w-4 shrink-0 text-terracotta">
                    <DropdownMenu.ItemIndicator>
                      <Check className="size-3.5" aria-hidden />
                    </DropdownMenu.ItemIndicator>
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-medium text-navy">{code}</span>
                    <span className="text-xs text-muted">{CURRENCY_META[code].label}</span>
                  </span>
                </DropdownMenu.RadioItem>
              )
            })}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
