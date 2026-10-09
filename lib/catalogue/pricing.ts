/**
 * Price rules, kept free of any data import so client components can use them
 * without pulling the catalogue into the browser bundle.
 *
 * PKR is canonical. A product with no source price has *no* price — it is never
 * coerced to zero and never estimated.
 */

import type { Product } from '@/types/catalogue'

export type PriceFields = Pick<Product, 'regularPricePKR' | 'salePricePKR'>

export function hasPrice(product: PriceFields): boolean {
  return product.regularPricePKR !== undefined || product.salePricePKR !== undefined
}

/**
 * The price a shopper pays. Where the export lists a sale price without a
 * regular price, the sale figure is simply the price.
 */
export function effectivePricePKR(product: PriceFields): { amount?: number; isSale: boolean } {
  if (product.salePricePKR !== undefined) return { amount: product.salePricePKR, isSale: true }
  if (product.regularPricePKR !== undefined) return { amount: product.regularPricePKR, isSale: false }
  return { amount: undefined, isSale: false }
}

/** Only shown when a genuine markdown exists in the source data. */
export function isOnSale(product: PriceFields): boolean {
  return (
    product.salePricePKR !== undefined &&
    product.regularPricePKR !== undefined &&
    product.salePricePKR < product.regularPricePKR
  )
}
