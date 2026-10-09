import Link from 'next/link'
import { Check } from 'lucide-react'

export type FilterOption = {
  key: string
  label: string
  count: number
  /** Built by the page so each option keeps every other active filter. */
  href: string
  active: boolean
  /** A CSS colour rendered as a dot before the label — the colour facet. */
  swatch?: string
}

export type FilterGroup = {
  heading: string
  options: FilterOption[]
}

/**
 * The shop sidebar. Every option is a link, so the whole filter set is
 * server-rendered, shareable and needs no client JavaScript; the active option
 * is ticked and re-clicking it clears that filter.
 */
export function ShopFilters({ groups, resetHref }: { groups: FilterGroup[]; resetHref: string }) {
  const populated = groups.filter((group) => group.options.length > 0)
  if (populated.length === 0) return null

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-navy">Filters</h2>
        <Link
          href={resetHref}
          className="text-[0.6875rem] font-medium tracking-[0.12em] text-terracotta uppercase transition-colors duration-200 hover:text-terracotta-dark"
        >
          Reset all
        </Link>
      </div>

      <div className="mt-4 divide-y divide-border">
        {populated.map((group) => (
          <section key={group.heading} className="py-4 first:pt-0 last:pb-0">
            <h3 className="text-[0.8125rem] font-semibold tracking-[0.04em] text-navy uppercase">{group.heading}</h3>
            <ul className="mt-3 space-y-0.5">
              {group.options.map((option) => (
                <li key={option.key}>
                  <Link
                    href={option.href}
                    aria-current={option.active ? 'true' : undefined}
                    className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[0.875rem] transition-colors duration-200 hover:bg-surface-muted"
                  >
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors duration-200 ${
                        option.active
                          ? 'border-terracotta bg-terracotta text-white'
                          : 'border-border-strong text-transparent group-hover:border-navy/50'
                      }`}
                      aria-hidden
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>

                    {option.swatch ? (
                      <span
                        className="size-3.5 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: option.swatch }}
                        aria-hidden
                      />
                    ) : null}

                    <span
                      className={`min-w-0 flex-1 truncate ${
                        option.active ? 'font-medium text-navy' : 'text-ink-soft group-hover:text-navy'
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">({option.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
