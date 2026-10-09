import { ProductGrid } from '@/components/catalogue/product-grid'
import { SectionHeading } from '@/components/home/section-heading'
import type { Product } from '@/types/catalogue'

type CollectionBlockProps = {
  /** The anchor label the live homepage uses, e.g. "For Bed". */
  anchor: string
  heading: string
  body: string
  products: Product[]
  href: string
  linkLabel: string
}

/** One collection: the live headline copy, then real products from that category. */
export function CollectionBlock({ anchor, heading, body, products, href, linkLabel }: CollectionBlockProps) {
  if (products.length === 0) return null

  return (
    <section className="container-page py-14 lg:py-16">
      <SectionHeading eyebrow={anchor} title={heading} description={body} link={{ href, label: linkLabel }} />
      <ProductGrid products={products} className="mt-10" />
    </section>
  )
}
