/**
 * Sort vocabulary, kept free of any data import so client components can render
 * the control without pulling the catalogue into the browser bundle.
 */

import { effectivePricePKR } from '@/lib/catalogue/pricing'
import type { Product } from '@/types/catalogue'

export type ProductSort = 'default' | 'name-asc' | 'price-asc' | 'price-desc'

export const productSortOptions: Array<{ value: ProductSort; label: string }> = [
  { value: 'default', label: 'Featured' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
]

export function isProductSort(value: string | undefined): value is ProductSort {
  return productSortOptions.some((option) => option.value === value)
}

/**
 * Sorts a product list. Products with no source price always sink to the end of
 * a price sort instead of being treated as free.
 */
export function sortProducts(list: Product[], sort: ProductSort): Product[] {
  const sorted = [...list]
  switch (sort) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'en'))
    case 'price-asc':
    case 'price-desc': {
      const direction = sort === 'price-asc' ? 1 : -1
      return sorted.sort((a, b) => {
        const left = effectivePricePKR(a).amount
        const right = effectivePricePKR(b).amount
        if (left === undefined && right === undefined) return a.name.localeCompare(b.name, 'en')
        if (left === undefined) return 1
        if (right === undefined) return -1
        return (left - right) * direction
      })
    }
    default:
      return sorted
  }
}
