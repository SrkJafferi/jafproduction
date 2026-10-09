import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

/**
 * Filtered and parameterised catalogue views are crawlable but not indexed: the
 * canonical tags point at the clean paths, and this keeps crawlers off the
 * query-string permutations entirely.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*?'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
