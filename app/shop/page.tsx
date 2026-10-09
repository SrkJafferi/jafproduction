import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { CatalogueBanner } from '@/components/layout/catalogue-banner'
import { CategoryChips, type CategoryChip } from '@/components/catalogue/category-chips'
import { ShopFilters, type FilterGroup } from '@/components/catalogue/shop-filters'
import { ProductGrid } from '@/components/catalogue/product-grid'
import { SortSelect } from '@/components/catalogue/sort-select'
import { WhatsAppGlyph } from '@/components/whatsapp/whatsapp-float'
import {
  allProducts,
  colorSwatch,
  facetCounts,
  filterProducts,
  getCategory,
  hasPrice,
  isProductSort,
  sortProducts,
} from '@/lib/catalogue'
import { productSortOptions } from '@/lib/catalogue/sorts'
import { buildMetadata } from '@/lib/seo/metadata'
import { legacyPageMetadata } from '@/lib/seo/legacy-metadata'
import { siteConfig } from '@/lib/site-config'
import { generalEnquiryUrl } from '@/lib/whatsapp'

const harvested = legacyPageMetadata('/shop/')

const SHOP_TITLE = harvested.title ?? `Shop all products | ${siteConfig.name}`

export const metadata: Metadata = buildMetadata({
  path: '/shop/',
  title: SHOP_TITLE,
  titleMode: 'absolute',
  description:
    harvested.description ??
    'Browse every JAF Global Trading product: bath towels, bathrobes, bedding, bath slippers, kitchen towels, leggings and trousers.',
})

/** The category rail under the banner — the leaf categories the shop actually stocks. */
const CHIP_PATHS = [
  'bath/towels/bath-towel',
  'bath/towels/bathrobes',
  'bath/bath-slippers',
  'bedding/sheet-pillow-cases',
  'bedding/blankets-throws',
  'bath/towels/shower-wrap',
  'leggings',
  'trousers',
]

type ShopSearchParams = {
  q?: string
  sort?: string
  price?: string
  category?: string
  material?: string
  color?: string
}

/** Everything the URL can carry, so a link can be rebuilt with one change. */
type FilterState = {
  q?: string
  sort?: string
  price?: string
  category?: string
  material?: string
  color?: string
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const sort = isProductSort(params.sort) ? params.sort : 'default'
  const priceState = params.price === 'priced' || params.price === 'ask' ? params.price : 'all'
  const category = params.category?.replace(/^\/+|\/+$/g, '') || undefined
  const material = params.material?.trim() || undefined
  const color = params.color?.trim() || undefined

  const base: FilterState = { q: query, sort, price: priceState, category, material, color }

  /** Rebuilds `/shop/?…` with one value changed — `undefined` clears it. */
  const hrefFor = (overrides: Partial<FilterState>): string => {
    const next = { ...base, ...overrides }
    const search = new URLSearchParams()
    if (next.q) search.set('q', next.q)
    if (next.sort && next.sort !== 'default') search.set('sort', next.sort)
    if (next.price && next.price !== 'all') search.set('price', next.price)
    if (next.category) search.set('category', next.category)
    if (next.material) search.set('material', next.material)
    if (next.color) search.set('color', next.color)
    const qs = search.toString()
    return `/shop/${qs ? `?${qs}` : ''}`
  }

  const products = sortProducts(filterProducts(allProducts, { query, priceState, categoryPath: category, material, color }), sort)

  // Facet counts are taken with that one facet lifted, so a count always reflects
  // what clicking it would actually return.
  const categoryPool = filterProducts(allProducts, { query, priceState, material, color })
  const materialPool = filterProducts(allProducts, { query, priceState, categoryPath: category, color })
  const colorPool = filterProducts(allProducts, { query, priceState, categoryPath: category, material })
  const categoryCounts = facetCounts(categoryPool).categories
  const materialCounts = facetCounts(materialPool).materials
  const colorCounts = facetCounts(colorPool).colors

  const chips: CategoryChip[] = CHIP_PATHS.map((path) => {
    const node = getCategory(path)
    return {
      path,
      label: node?.name ?? path,
      href: hrefFor({ category: category === path ? undefined : path }),
      active: category === path,
    }
  })

  const filterGroups: FilterGroup[] = [
    {
      heading: 'Categories',
      options: categoryCounts.map((entry) => ({
        key: entry.path,
        label: entry.label,
        count: entry.count,
        href: hrefFor({ category: category === entry.path ? undefined : entry.path }),
        active: category === entry.path,
      })),
    },
    {
      heading: 'Price',
      options: [
        {
          key: 'priced',
          label: 'Priced',
          count: categoryPool.filter(hasPrice).length,
          href: hrefFor({ price: priceState === 'priced' ? 'all' : 'priced' }),
          active: priceState === 'priced',
        },
        {
          key: 'ask',
          label: 'Ask for price',
          count: categoryPool.filter((product) => !hasPrice(product)).length,
          href: hrefFor({ price: priceState === 'ask' ? 'all' : 'ask' }),
          active: priceState === 'ask',
        },
      ],
    },
    {
      heading: 'Material',
      options: materialCounts.map((entry) => ({
        key: entry.value,
        label: entry.label,
        count: entry.count,
        href: hrefFor({ material: material === entry.value ? undefined : entry.value }),
        active: material === entry.value,
      })),
    },
    {
      heading: 'Colour',
      options: colorCounts.map((entry) => ({
        key: entry.value,
        label: entry.label,
        count: entry.count,
        href: hrefFor({ color: color === entry.value ? undefined : entry.value }),
        active: color === entry.value,
        swatch: colorSwatch(entry.value),
      })),
    },
  ]

  const filteredView = Boolean(query || category || material || color || priceState !== 'all' || sort !== 'default')
  const shown = products.length

  return (
    <>
      <CatalogueBanner
        title={SHOP_TITLE}
        highlight="JAF Trading"
        subtitle={harvested.description}
        trail={[{ label: 'Home', href: '/' }, { label: 'Shop' }]}
        image={{
          src: '/images/brand/shop-banner.avif',
          alt: 'Folded JAF cotton towels resting in soft daylight',
        }}
      />

      <CategoryChips items={chips} />

      <div className="container-page py-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
          {/* Mobile keeps the compact filter rail; the full sidebar is desktop-only. */}
          <aside className="hidden lg:block">
            <ShopFilters groups={filterGroups} resetHref="/shop/" />
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.875rem] text-ink-soft" aria-live="polite">
                Showing <strong className="font-medium text-navy">{shown}</strong> of {allProducts.length} products
              </p>

              <div className="flex items-center gap-3">
                <form action="/shop/" method="get" role="search" className="relative hidden sm:block">
                  <label htmlFor="shop-search" className="sr-only">
                    Search the catalogue
                  </label>
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                    aria-hidden
                  />
                  <input
                    id="shop-search"
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search products"
                    className="w-44 rounded-full border border-border bg-surface-muted py-2 pr-3 pl-9 text-sm text-ink transition-colors duration-200 placeholder:text-muted/80 focus:border-border-strong focus:outline-none lg:w-52"
                  />
                </form>
                <SortSelect options={productSortOptions} value={sort} />
              </div>
            </div>

            {/* Mobile filter rail — the sidebar is hidden below `lg`. */}
            <div className="mt-4 flex flex-wrap items-center gap-2 lg:hidden">
              {filterGroups
                .flatMap((group) => group.options)
                .filter((option) => option.active)
                .map((option) => (
                  <Link
                    key={`active-${option.key}`}
                    href={hrefFor({
                      category: option.key === category ? undefined : category,
                      material: option.key === material ? undefined : material,
                      color: option.key === color ? undefined : color,
                      price: option.key === priceState ? 'all' : priceState,
                    })}
                    className="btn border border-border px-3 py-1.5 text-[0.6875rem] font-medium tracking-[0.1em] text-ink-soft uppercase transition-colors duration-200 hover:border-navy/40 hover:text-navy"
                  >
                    {option.label} ✕
                  </Link>
                ))}
              {filteredView ? (
                <Link
                  href="/shop/"
                  className="text-[0.6875rem] font-medium tracking-[0.12em] text-terracotta uppercase transition-colors duration-200 hover:text-terracotta-dark"
                >
                  Clear filters
                </Link>
              ) : null}
            </div>

            {shown > 0 ? (
              <ProductGrid products={products} priorityCount={4} className="mt-6" />
            ) : (
              <div className="mt-8 rounded-2xl border border-border bg-surface-muted p-10 text-center">
                <h2 className="text-xl font-medium text-navy">Nothing matches those filters</h2>
                <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">
                  Try a different combination, or tell us what you are looking for and our team will confirm what is
                  available.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/shop/"
                    className="btn bg-navy px-5 py-2.5 text-[0.8125rem] font-medium tracking-[0.08em] text-white uppercase transition-colors duration-200 hover:bg-navy-soft"
                  >
                    Show all products
                  </Link>
                  <a
                    href={generalEnquiryUrl('a product I cannot find')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn inline-flex items-center gap-2 bg-whatsapp px-5 py-2.5 text-[0.8125rem] font-medium text-white transition-colors duration-200 hover:bg-whatsapp-dark"
                  >
                    <WhatsAppGlyph className="size-4" />
                    Ask on WhatsApp
                  </a>
                </div>
              </div>
            )}

            <p className="mt-8 border-t border-border pt-5 text-sm text-muted">
              {products.filter(hasPrice).length} of {shown} listed products carry a price in the source data. Everything
              else is quoted on request — we never guess a figure.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
