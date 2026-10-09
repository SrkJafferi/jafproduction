'use client'

import type { ProductSort } from '@/lib/catalogue/sorts'

type SortSelectProps = {
  options: Array<{ value: ProductSort; label: string }>
  value: ProductSort
  /** The form this select belongs to is submitted on change (with JS only). */
  label?: string
}

/**
 * A native `<select>` that submits its surrounding GET form when it changes, so
 * sorting needs no router, no state and no client-side data. Without JavaScript
 * the same select still works through the form's Apply button.
 */
export function SortSelect({ options, value, label = 'Sort' }: SortSelectProps) {
  return (
    <label className="flex items-center gap-2 text-xs tracking-[0.14em] text-muted uppercase">
      {label}
      <select
        name="sort"
        defaultValue={value}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="btn border border-border bg-surface px-3 py-2 text-xs tracking-normal text-ink normal-case focus:border-border-strong focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
