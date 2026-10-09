import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Price } from '@/components/currency/price'
import { WhatsAppGlyph } from '@/components/whatsapp/whatsapp-float'
import { isOnSale } from '@/lib/catalogue/pricing'
import { productPath } from '@/lib/catalogue/paths'
import { siteConfig } from '@/lib/site-config'
import { whatsAppUrl } from '@/lib/whatsapp'
import type { Product } from '@/types/catalogue'

/**
 * One catalogue entry, presented the way the live store presents products:
 * a white card with the product photo, small uppercase category line, grey
 * two-line title, price with the orange sale treatment, and the pink/green
 * corner badges. The WhatsApp enquiry takes the place of the old add-to-cart
 * button, since ordering happens in chat.
 *
 * The card owns its whole frame — rounded corners, resting shadow and the
 * hover lift — rather than leaving it to each caller's wrapper. The homepage
 * carousel and the catalogue grid therefore render the identical card, and the
 * photo zoom stays clipped by the card's own `overflow-hidden`.
 */
export function ProductCard({
  product,
  priority = false,
  showFeaturedBadge = true,
}: {
  product: Product
  priority?: boolean
  /** The pink "Featured" flash — the homepage showcase hides it, since that
      section is already titled "Featured". */
  showFeaturedBadge?: boolean
}) {
  const image = product.images[0]
  const href = productPath(product.slug)
  const category = product.primaryCategory
  const onSale = isOnSale(product)

  // The green discount chip shows how far the sale price sits below regular,
  // exactly like the "-22%" flash on the live cards.
  const discountPercent =
    onSale && product.regularPricePKR && product.salePricePKR && product.regularPricePKR > product.salePricePKR
      ? Math.round((1 - product.salePricePKR / product.regularPricePKR) * 100)
      : undefined

  const quickEnquiry = whatsAppUrl(
    [
      `Hello ${siteConfig.name},`,
      '',
      'I would like to ask about:',
      '',
      `Product: ${product.name}`,
      ...(product.sku ? [`SKU: ${product.sku}`] : []),
      `Product URL: ${siteConfig.url}${href}`,
      '',
      'Please share availability and ordering details.',
    ].join('\n'),
  )

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-card transition-[box-shadow,transform,scale,translate] duration-300 ease-[var(--ease-premium)] hover:-translate-y-1.5 hover:scale-[1.025] hover:shadow-card-hover">
      <Link
        href={href}
        className="relative block overflow-hidden bg-white"
        aria-label={product.name}
        tabIndex={-1}
      >
        <div className="relative aspect-square">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
              quality={78}
              priority={priority}
              className="object-cover transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-[1.03]"
            />
          ) : (
            <Image
              src={siteConfig.media.productPlaceholder}
              alt={`${product.name} — photography coming soon`}
              fill
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
              className="object-cover"
            />
          )}
        </div>

        {product.featured && showFeaturedBadge ? (
          <span className="absolute top-3 left-3">
            <Badge tone="featured">Featured</Badge>
          </span>
        ) : null}
        {discountPercent !== undefined ? (
          <span className="absolute top-3 right-3">
            <Badge tone="sale">-{discountPercent}%</Badge>
          </span>
        ) : null}
        {!image ? (
          <span className="absolute bottom-3 left-3">
            <Badge tone="ask">Photo soon</Badge>
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4">
        {category ? (
          <p className="text-[0.6875rem] tracking-[0.16em] text-muted uppercase">{category.name}</p>
        ) : null}

        <h3 className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[0.9375rem] leading-snug font-normal text-ink-soft">
          <Link href={href} className="transition-colors duration-200 group-hover:text-terracotta">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2">
          <Price regularPricePKR={product.regularPricePKR} salePricePKR={product.salePricePKR} />
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3.5">
          <a
            href={quickEnquiry}
            target="_blank"
            rel="noopener noreferrer"
            className="btn inline-flex flex-1 items-center justify-center gap-1 bg-navy px-2 py-2 text-[0.625rem] font-medium tracking-[0.08em] whitespace-nowrap text-white uppercase transition-colors duration-200 hover:bg-terracotta"
            aria-label={`Ask about ${product.name} on WhatsApp`}
          >
            <WhatsAppGlyph className="size-3" />
            Enquire
          </a>
          <Link
            href={href}
            className="btn inline-flex flex-1 items-center justify-center border border-navy/20 px-2 py-2 text-[0.625rem] font-medium tracking-[0.08em] whitespace-nowrap text-navy uppercase transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
