/**
 * Canonical URL paths, kept in one place so every link (and every canonical tag)
 * carries the trailing slash the legacy URLs use.
 */

export function productPath(slug: string): string {
  return `/product/${slug}/`
}

export function categoryPath(path: string): string {
  return `/product-category/${path.replace(/^\/+|\/+$/g, '')}/`
}
