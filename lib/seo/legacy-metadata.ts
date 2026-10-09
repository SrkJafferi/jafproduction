/**
 * The hand-written Rank Math metadata harvested from the live site.
 *
 * These titles and descriptions are what the pages currently rank with, so they
 * are reused verbatim (as absolute titles, since they already carry the brand
 * suffix) instead of being rewritten.
 */

import legacySeoFile from '@/data/legacy-seo.json'
import { siteConfig } from '@/lib/site-config'

type LegacyEntry = {
  kind: string
  title?: string
  description?: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
}

const legacy = legacySeoFile as unknown as Record<string, LegacyEntry>

export type LegacyMetadata = {
  title?: string
  description?: string
  /** True when the source text was actually harvested. */
  harvested: boolean
}

function lookup(key: string): LegacyMetadata {
  const entry = legacy[key]
  if (!entry) return { harvested: false }
  return { title: entry.title, description: entry.description, harvested: Boolean(entry.title) }
}

/** `/shop/`, `/about-us/`, `/contact-us/`, `/` … */
export function legacyPageMetadata(path: string): LegacyMetadata {
  return lookup(`${siteConfig.url}${path}`)
}

export function legacyProductMetadata(slug: string): LegacyMetadata {
  return lookup(`${siteConfig.url}/product/${slug}/`)
}

export function legacyCategoryMetadata(path: string): LegacyMetadata {
  return lookup(`${siteConfig.url}/product-category/${path}/`)
}
