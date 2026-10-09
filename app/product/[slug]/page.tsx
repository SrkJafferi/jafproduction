import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ClipboardList, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ProductGallery } from '@/components/product/product-gallery'
import {
  FeatureList,
  PricePanel,
  ProductFacts,
  ProductFilm,
  ProductMedia,
  SpecTable,
} from '@/components/product/product-details'
import { FeaturedShowcase } from '@/components/home/featured-showcase'
import { WhatsAppEnquiry } from '@/components/whatsapp/whatsapp-enquiry'
import { getAllProductSlugs, getProduct, isOnSale, relatedProducts } from '@/lib/catalogue'
import { productPlaceholder } from '@/lib/catalogue/media'
import { categoryPath, productPath } from '@/lib/catalogue/paths'
import { siteConfig } from '@/lib/site-config'
import { buildMetadata } from '@/lib/seo/metadata'
import { legacyProductMetadata } from '@/lib/seo/legacy-metadata'
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo/json-ld'

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams(): Array<{ slug: string }> {
  return getAllProductSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return buildMetadata({ path: `/product/${slug}/`, index: false })

  const harvested = legacyProductMetadata(slug)
  const image = product.images[0]?.src ?? siteConfig.media.ogImage

  return buildMetadata({
    path: productPath(product.slug),
    title: harvested.title ?? `${product.name} | ${siteConfig.name}`,
    titleMode: 'absolute',
    description: harvested.description ?? product.intro,
    image,
  })
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  // Trail stays short: Home / top family / leaf family / product, so deep legacy
  // category paths do not produce an unreadable breadcrumb.
  const topCategory = product.categories.find((ref) => ref.depth === 0)
  const trail = [
    { label: 'Home', href: '/' },
    ...(topCategory ? [{ label: topCategory.name, href: categoryPath(topCategory.path) }] : []),
    ...(product.primaryCategory && product.primaryCategory.path !== topCategory?.path
      ? [{ label: product.primaryCategory.name, href: categoryPath(product.primaryCategory.path) }]
      : []),
    { label: product.name },
  ]

  // Eight is the carousel's cap — the same looping track the homepage uses.
  const related = relatedProducts(product, 8)
  const onSale = isOnSale(product)
  const showFeatures = product.features.length > 0
  const showSpecs = product.specs.length > 0
  const showFilm = product.videos.length > 0
  // Key features, Specifications and the product film are peers on the tinted
  // band, and empty ones drop out — so the column count follows what is actually
  // there rather than leaving a gap where a card is missing.
  const bandColumns = [showFeatures, showSpecs, showFilm].filter(Boolean).length

  return (
    <>
      {/* Breadcrumb on the plain page — the design drops the old dark banner. */}
      <div className="container-page pt-6">
        <Breadcrumbs trail={trail} />
      </div>

      {/* Summary: gallery beside the product facts. */}
      <section className="container-page grid gap-10 pt-6 pb-12 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} productName={product.name} placeholder={productPlaceholder} />

        <div className="lg:pt-1">
          <div className="flex flex-wrap items-center gap-3">
            {product.primaryCategory ? (
              <Link
                href={categoryPath(product.primaryCategory.path)}
                className="text-[0.6875rem] font-medium tracking-[0.18em] text-ink-soft uppercase transition-colors duration-200 hover:text-terracotta"
              >
                {product.primaryCategory.name}
              </Link>
            ) : null}
            {onSale ? <Badge tone="sale">Sale</Badge> : null}
          </div>

          <h1 className="mt-3 text-[1.625rem] leading-snug font-semibold text-navy sm:text-[2rem]">{product.name}</h1>

          <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.9375rem]">
            <div className="flex items-center gap-2">
              <span
                className={`size-2 shrink-0 rounded-full ${product.inStock ? 'bg-sale' : 'bg-muted'}`}
                aria-hidden
              />
              <dt className="text-muted">Availability</dt>
              <dd className="text-navy">{product.inStock ? 'In stock' : 'Confirm on WhatsApp'}</dd>
            </div>
            {product.sku ? (
              <div className="flex items-center gap-2">
                <dt className="text-muted">SKU</dt>
                <dd className="text-navy">{product.sku}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6">
            <PricePanel regularPricePKR={product.regularPricePKR} salePricePKR={product.salePricePKR} />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <WhatsAppEnquiry product={product} className="sm:flex-1" />
            <Link
              href="/shop/"
              className="btn inline-flex items-center justify-center gap-2 border border-navy/20 bg-white px-5 py-3 text-sm font-medium tracking-wide text-navy transition-colors duration-200 hover:border-navy sm:flex-1"
            >
              Keep Browsing
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted">
            Orders are confirmed by our team on WhatsApp. Prices are held in PKR; any other currency shown is an
            indicative conversion.
          </p>

          <ProductFacts material={product.facets.material} size={product.facets.size} />

          {product.intro ? (
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-ink-soft">{product.intro}</p>
          ) : null}
        </div>
      </section>

      {/* Key features, the specification sheet and the product film, as peers on a
          tinted band. */}
      {bandColumns > 0 ? (
        <section className="bg-surface-muted">
          <div
            className={`container-page grid gap-6 py-12 ${
              bandColumns >= 3 ? 'lg:grid-cols-3 lg:gap-8' : bandColumns === 2 ? 'lg:grid-cols-2 lg:gap-8' : ''
            }`}
          >
            {showFeatures ? (
              <div className="rounded-2xl border border-border bg-white p-6 sm:p-7">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-navy">
                  <Star className="size-5 shrink-0 fill-current text-terracotta" aria-hidden />
                  Key features
                </h2>
                <div className="mt-5">
                  <FeatureList features={product.features} />
                </div>
              </div>
            ) : null}

            {showSpecs ? (
              <div className="rounded-2xl border border-border bg-white p-6 sm:p-7">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-navy">
                  <ClipboardList className="size-5 shrink-0 text-terracotta" aria-hidden />
                  Specifications
                </h2>
                <div className="mt-5">
                  <SpecTable specs={product.specs} />
                </div>
              </div>
            ) : null}

            {showFilm ? <ProductFilm videos={product.videos} className="self-start" /> : null}
          </div>
        </section>
      ) : null}

      {/* Size/colour options — only two products in the catalogue carry them. */}
      {product.attributes.length > 0 ? (
        <section className="container-page pt-10">
          <h2 className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Options</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {product.attributes.flatMap((attribute) =>
              attribute.values.map((value) => (
                <li key={`${attribute.name}-${value}`} className="rounded-full border border-border px-3.5 py-1.5 text-sm text-ink-soft">
                  {value}
                </li>
              )),
            )}
          </ul>
        </section>
      ) : null}

      {product.bodyParagraphs.length > 0 ? (
        <section className="container-page mt-12 max-w-3xl" aria-labelledby="product-details-heading">
          <h2 id="product-details-heading" className="text-xl font-medium text-navy">
            Product details
          </h2>
          <div className="mt-4 space-y-4 text-[0.9375rem] leading-relaxed text-ink-soft">
            {product.bodyParagraphs.map((paragraph, index) => (
              <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {product.contentImages.length > 0 ? (
        <div className="container-page">
          <ProductMedia product={product} />
        </div>
      ) : null}

      {related.length > 0 ? (
        <FeaturedShowcase
          products={related}
          heading={{ title: 'Recommended products' }}
          background="white"
          className="mt-14 border-t border-border"
          perView={4}
        />
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              trail.map((crumb) => ({ name: crumb.label, href: crumb.href ?? productPath(product.slug) })),
            ),
          ),
        }}
      />
    </>
  )
}
