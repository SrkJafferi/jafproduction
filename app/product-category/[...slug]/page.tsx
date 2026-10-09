import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Search } from 'lucide-react'
import { PageBanner } from '@/components/layout/page-banner'
import { ProductGrid } from '@/components/catalogue/product-grid'
import { WhatsAppGlyph } from '@/components/whatsapp/whatsapp-float'
import { allCategories, categoryBreadcrumb, getCategoryFromSegments, productsInCategory } from '@/lib/catalogue'
import { heroBanners } from '@/lib/catalogue/media'
import { categoryPath } from '@/lib/catalogue/paths'
import { buildMetadata } from '@/lib/seo/metadata'
import { legacyCategoryMetadata } from '@/lib/seo/legacy-metadata'
import { breadcrumbJsonLd, categoryJsonLd } from '@/lib/seo/json-ld'
import { siteConfig } from '@/lib/site-config'
import { generalEnquiryUrl } from '@/lib/whatsapp'

type CategoryPageProps = {
  params: Promise<{ slug: string[] }>
}

/** Every legacy `/product-category/<path>/` URL is pre-rendered. */
export function generateStaticParams(): Array<{ slug: string[] }> {
  return allCategories.map((category) => ({ slug: category.path.split('/') }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryFromSegments(slug)
  if (!category) return buildMetadata({ path: '/shop/', index: false })

  const harvested = legacyCategoryMetadata(category.path)

  return buildMetadata({
    path: categoryPath(category.path),
    title: harvested.title ?? `${category.name} | ${siteConfig.name}`,
    titleMode: 'absolute',
    description:
      harvested.description ??
      `Shop ${category.name.toLowerCase()} from JAF Global Trading — ${category.totalProductCount} products, 100% cotton, supplied to homes, hotels and retailers.`,
  })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategoryFromSegments(slug)
  if (!category) notFound()

  // Pages stay fully static: browsing, searching and sorting all live on /shop/,
  // so each legacy category URL is served straight from the CDN.
  const products = productsInCategory(category.path)

  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop/' },
    ...categoryBreadcrumb(category.path)
      .slice(0, -1)
      .map((entry) => ({ label: entry.name, href: categoryPath(entry.path) })),
    { label: category.name },
  ]

  const children = category.children
    .map((path) => allCategories.find((candidate) => candidate.path === path))
    .filter((child): child is NonNullable<typeof child> => Boolean(child))

  return (
    <>
      {/* Dark title banner, as the live category pages open. */}
      <PageBanner
        title={category.name}
        trail={trail}
        image={
          heroBanners[1]
            ? { src: heroBanners[1].src, alt: '' }
            : undefined
        }
      />

      <div className="container-page py-8 lg:py-10">
        {children.length > 0 ? (
          <nav aria-label="Sub-categories" className="border-y border-border py-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {children.map((child) => (
                <li key={child.path}>
                  <Link
                    href={categoryPath(child.path)}
                    className="text-[0.8125rem] tracking-[0.06em] text-ink-soft uppercase transition-colors duration-200 hover:text-terracotta"
                  >
                    {child.name}
                    <span className="ml-1.5 text-xs text-muted normal-case">({child.totalProductCount})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <p className="text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
            {products.length} {products.length === 1 ? 'product' : 'products'} in {category.name}
          </p>
          <Link
            href={`/shop/?q=${encodeURIComponent(category.name)}`}
            className="inline-flex items-center gap-2 text-[0.6875rem] font-medium tracking-[0.14em] text-navy uppercase transition-colors duration-200 hover:text-terracotta"
          >
            <Search className="size-3.5" aria-hidden />
            Search &amp; sort the full catalogue
          </Link>
        </div>

        {products.length > 0 ? (
          <ProductGrid products={products} priorityCount={4} className="mt-8" />
        ) : (
          <div className="mt-10 border border-border bg-surface-muted p-10 text-center">
            <h2 className="text-xl font-medium text-navy">This category has no published products yet</h2>
            <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">
              Tell us what you need and our team will confirm what is available, with pricing and delivery.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/shop/"
                className="btn bg-navy px-5 py-2.5 text-[0.8125rem] font-medium tracking-[0.08em] text-white uppercase transition-colors duration-200 hover:bg-navy-soft"
              >
                Show all products
              </Link>
              <a
                href={generalEnquiryUrl(category.name.toLowerCase())}
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
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd(category)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              trail.map((crumb) => ({ name: crumb.label, href: crumb.href ?? categoryPath(category.path) })),
            ),
          ),
        }}
      />
    </>
  )
}
