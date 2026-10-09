import { ProductCard } from '@/components/catalogue/product-card'
import type { Product } from '@/types/catalogue'

type ProductGridProps = {
  products: Product[]
  /** Marks the first row of above-the-fold images as priority for LCP. */
  priorityCount?: number
  className?: string
}

/** Compact commerce grid — the density the live store uses (4-up desktop). */
export function ProductGrid({ products, priorityCount = 0, className }: ProductGridProps) {
  return (
    <ul className={`grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-5 ${className ?? ''}`}>
      {products.map((product, index) => (
        <li key={product.slug} className="h-full">
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  )
}
