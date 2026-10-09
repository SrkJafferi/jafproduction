/**
 * Metadata helpers.
 *
 * Where the audit harvested hand-written Rank Math metadata, that text is used
 * verbatim so search results keep the wording the site already ranks with;
 * otherwise a factual title is composed from the product or category name —
 * never from invented marketing claims.
 */

import type { Metadata } from 'next'
import { siteConfig } from '@/lib/site-config'

export type MetadataSeed = {
  /** Canonical path, always with the trailing slash the site uses. */
  path: string
  title?: string
  description?: string
  /**
   * `absolute` is used for harvested titles, which already carry the brand
   * suffix — letting the layout template add it again would double it up.
   */
  titleMode?: 'template' | 'absolute'
  image?: string
  /** `false` keeps thin or duplicate pages out of the index. */
  index?: boolean
  /** Set for pages whose content is a filtered view of another page. */
  canonicalPath?: string
}

export function buildMetadata(seed: MetadataSeed): Metadata {
  const canonical = seed.canonicalPath ?? seed.path
  const images = seed.image
    ? [{ url: seed.image, width: 1200, height: 630, alt: seed.title ?? siteConfig.name }]
    : undefined

  const title = seed.title
    ? seed.titleMode === 'absolute'
      ? { absolute: seed.title }
      : seed.title
    : undefined

  return {
    ...(title ? { title } : {}),
    ...(seed.description ? { description: seed.description } : {}),
    alternates: { canonical },
    ...(seed.index === false ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: seed.path.startsWith('/product/') ? 'website' : 'website',
      siteName: siteConfig.name,
      locale: 'en_US',
      url: canonical,
      ...(seed.title ? { title: seed.title } : {}),
      ...(seed.description ? { description: seed.description } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(seed.title ? { title: seed.title } : {}),
      ...(seed.description ? { description: seed.description } : {}),
      ...(seed.image ? { images: [seed.image] } : {}),
    },
  }
}
