import type { MetadataRoute } from 'next'
import { allCategories, allProducts } from '@/lib/catalogue'
import { categoryPath, productPath } from '@/lib/catalogue/paths'
import { siteConfig } from '@/lib/site-config'

/**
 * Every real URL the site serves, using the legacy slugs the audit harvested, so
 * nothing that used to rank disappears from the sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteConfig.url}/shop/`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/about-us/`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteConfig.url}/contact-us/`, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = allCategories.map((category) => ({
    url: `${siteConfig.url}${categoryPath(category.path)}`,
    changeFrequency: 'weekly',
    priority: category.depth === 0 ? 0.8 : 0.7,
  }))

  const productRoutes: MetadataRoute.Sitemap = allProducts.map((product) => ({
    url: `${siteConfig.url}${productPath(product.slug)}`,
    changeFrequency: 'monthly',
    priority: product.regularPricePKR !== undefined || product.salePricePKR !== undefined ? 0.7 : 0.6,
  }))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
