/**
 * Brand and category imagery, read from the generated image manifest so the
 * intrinsic dimensions always match the files the migration script wrote.
 *
 * Server-only by construction: pages read these and pass plain props down, so no
 * manifest data reaches the browser bundle.
 */

import manifestFile from '@/data/image-manifest.json'
import { siteConfig } from '@/lib/site-config'
import type { GeneratedAsset, ImageManifest } from '@/types/catalogue'

const manifest = manifestFile as unknown as ImageManifest

export type MediaImage = {
  src: string
  width: number
  height: number
  alt: string
}

const toMediaImage = (asset: GeneratedAsset, alt: string): MediaImage => ({
  src: asset.src,
  width: asset.width,
  height: asset.height,
  alt,
})

/** The three genuine JAF banners, used as the homepage hero rotation. */
export const heroBanners: MediaImage[] = manifest.brand.heroBanners.map((asset) =>
  toMediaImage(asset, 'JAF Global Trading linen and bathrobe collection banner'),
)

export const heroVideo: { src: string; poster: string } | undefined = manifest.brand.heroVideo
  ? { src: manifest.brand.heroVideo.src, poster: heroBanners[0]?.src ?? siteConfig.media.ogImage }
  : undefined

/**
 * The homepage hero photographs — a sunlit suite styled with JAF towels and robes,
 * then a golden-hour spa suite looking out to sea. They replaced the original
 * banner video as the opening screen and the hero cycles through them in order.
 *
 * Alt text is per-slide and indexed, so adding a photograph means adding a line
 * here too.
 */
const HERO_ALT = [
  'Sunlit hotel suite styled with folded JAF bath towels and bathrobes',
  'Golden-hour spa suite with a sea view, styled with JAF towels, a bathrobe and slippers',
]

export const heroImages: MediaImage[] = manifest.brand.heroImages.map((asset, index) =>
  toMediaImage(asset, HERO_ALT[index] ?? 'JAF Global Trading linens styled in a hotel suite'),
)

/** The genuine JAF gift-set promo photograph beside the Featured carousel. */
export const featuredPromo: MediaImage | undefined = manifest.brand.featuredPromo
  ? toMediaImage(manifest.brand.featuredPromo, 'JAF Global Trading premium bathrobes and towels gift set')
  : undefined

/** Category banners that exist for a given category path, if any. */
export function categoryBanner(path: string, alt: string): MediaImage | undefined {
  const asset = manifest.categories[path]
  return asset ? toMediaImage(asset, alt) : undefined
}

export const productPlaceholder: MediaImage = {
  src: siteConfig.media.productPlaceholder,
  width: 1200,
  height: 1200,
  alt: 'JAF Global Trading',
}

export const ogImage: MediaImage = {
  src: siteConfig.media.ogImage,
  width: 1200,
  height: 630,
  alt: siteConfig.name,
}
