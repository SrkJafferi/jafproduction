import { Search } from 'lucide-react'
import { SortSelect } from '@/components/catalogue/sort-select'
import { productSortOptions, type ProductSort } from '@/lib/catalogue/sorts'

type CatalogueControlsProps = {
  /** Server-rendered counts, so the numbers always match the grid below. */
  resultCount: number
  totalCount: number
  sort: ProductSort
  query: string
  /** Where the form submits — `/shop/` for the catalogue page. */
  action?: string
}

/**
 * Search and sort as a plain GET form: server-rendered results, shareable URLs,
 * and no client-side data fetching. The only JavaScript is the sort select
 * submitting the form for you.
 */
export function CatalogueControls({ resultCount, totalCount, sort, query, action = '/shop/' }: CatalogueControlsProps) {
  return (
    <div className="flex flex-col gap-4 border-y border-border py-4 md:flex-row md:items-center md:justify-between">
      <form action={action} method="get" role="search" className="flex w-full items-center gap-2 md:max-w-md">
        <span className="relative flex-1">
          <label htmlFor="catalogue-search" className="sr-only">
            Search the catalogue
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="catalogue-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by name, colour, GSM or SKU"
            className="w-full rounded-xs border border-border bg-surface py-2.5 pr-3 pl-9 text-sm text-ink placeholder:text-muted/80 focus:border-border-strong focus:outline-none"
          />
        </span>
        <button
          type="submit"
          className="btn border border-navy/20 bg-navy px-3.5 py-2.5 text-xs font-medium tracking-[0.14em] text-cream uppercase transition-colors duration-200 hover:bg-navy-soft"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-4">
        <p className="text-xs tracking-[0.14em] text-muted uppercase" aria-live="polite">
          {resultCount} of {totalCount} products
        </p>
        <SortSelect options={productSortOptions} value={sort} />
      </div>
    </div>
  )
}
