#!/usr/bin/env node
/**
 * One-time (but repeatable) image migration.
 *
 * Everything the rebuilt site serves lives under `public/images/**` and
 * `public/videos/**` — the frontend never depends on WordPress, on a GitHub CDN
 * or on any other third party to show a picture.
 *
 * Source priority, per the audit rules:
 *   1. the local mirror of the WordPress uploads (`reference/`, git-ignored)
 *   2. the original asset URL, fetched once and cached back into `reference/`
 *   3. a branded JAF placeholder for products whose photography is gone for good
 *      (never unrelated stock photography)
 *
 * Run: npm run data:images          (add --no-download to stay fully offline,
 *                                    --force to re-encode everything)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { createReferenceIndex, uploadPathFromUrl } from '../lib/catalogue/image-sources.ts'
import { mapRowsToLegacySlugs } from '../lib/catalogue/legacy-slugs.ts'
import { readMp4Dimensions } from '../lib/catalogue/video-dimensions.ts'
import { readWooExport } from '../lib/catalogue/woo-export.ts'
import type { GeneratedAsset, ImageManifest } from '../types/catalogue.ts'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))
const offline = args.has('--no-download')
const force = args.has('--force')

const PRODUCT_MAX_WIDTH = 1400
const BANNER_MAX_WIDTH = 1920
const CATEGORY_MAX_WIDTH = 1200
const CONTENT_MAX_WIDTH = 1024
const WEBP_QUALITY = 82

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/** Brand assets that only exist on the old CDN; cached into reference/_cdn. */
const CDN_ROOT = 'https://cdn.jsdelivr.net/gh/SrkJaffri/jaftradings@main'

// The hero banner video lives in a second brand repository on the same CDN, so the
// first URL 404s — keep both and use whichever answers.
const HERO_VIDEO = {
  file: 'banner05.mp4',
  target: 'public/videos/hero-banner.mp4',
  urls: ['https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/banner05.mp4', `${CDN_ROOT}/banner05.mp4`],
}

const HERO_BANNERS = [
  { file: 'bathrobebanner.avif', target: 'public/images/brand/hero-bathrobes.webp' },
  { file: 'beddingbanner.avif', target: 'public/images/brand/hero-bedding.webp' },
  { file: 'wrapbanner.avif', target: 'public/images/brand/hero-shower-wrap.webp' },
]

/**
 * The homepage hero photographs, supplied directly in the reference mirror rather
 * than on the old CDN, so they are encoded straight from those sources. The hero
 * cycles through them, so order is presentation order.
 */
const HERO_IMAGES = [
  {
    source: 'reference/Sunlit Luxury Suite with Towels and Robes.avif',
    target: 'public/images/brand/hero-suite.webp',
  },
  {
    source: 'reference/Golden Spa Suite with Sea Views.avif',
    target: 'public/images/brand/hero-suite-golden.webp',
  },
]

/**
 * The promo photograph beside the Featured carousel. Only ever existed on the
 * CDN, so it is cached into the reference mirror the first time and read from
 * there on every later run.
 */
const FEATURED_PROMO = {
  file: 'featured-promo.webp',
  target: 'public/images/brand/featured-promo.webp',
  url: `${CDN_ROOT}/ChatGPT%20Image%20May%203%2C%202026%2C%2001_11_07%20AM.webp`,
  /** Cache path for the downloaded original, so later runs stay offline. */
  cache: 'reference/_cdn/featured-promo.webp',
}

/**
 * In-content media referenced by product descriptions, keyed by original URL.
 * The videos are served with `preload="none"`, so their size never touches a
 * page load — they are only fetched when a visitor presses play. They live in
 * two brand repositories on the same CDN, hence the per-asset URL lists.
 */
const CONTENT_ASSETS = [
  { url: `${CDN_ROOT}/GSMcomparison.webp`, target: 'public/images/content/gsm-comparison.webp', maxWidth: CONTENT_MAX_WIDTH },
  { url: `${CDN_ROOT}/process01.webp`, target: 'public/images/content/textile-process.webp', maxWidth: CONTENT_MAX_WIDTH },
  { url: `${CDN_ROOT}/p03.mp4`, target: 'public/videos/product-demo.mp4', video: true, urls: [`${CDN_ROOT}/p03.mp4`] },
  {
    url: 'https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/p01.mp4',
    target: 'public/videos/product-film-01.mp4',
    video: true,
    urls: ['https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/p01.mp4'],
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/jaftradings01.mp4',
    target: 'public/videos/product-film-02.mp4',
    video: true,
    urls: ['https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/jaftradings01.mp4'],
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/jaftradings02.mp4',
    target: 'public/videos/product-film-03.mp4',
    video: true,
    urls: ['https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main/jaftradings02.mp4'],
  },
]

/** Category banners lifted from the live homepage, keyed by category path. */
const CATEGORY_BANNERS: Array<{ path: string; reference: string; target: string }> = [
  { path: 'bedding', reference: 'reference/2023/09/bedskirt_white_700x.webp', target: 'public/images/categories/bedding.webp' },
  {
    path: 'bath/towels/bathrobes',
    reference: 'reference/2026/04/Gemini_Generated_Image_xmtoboxmtoboxmto.webp',
    target: 'public/images/categories/bathrobes.webp',
  },
  {
    path: 'bath/towels',
    reference: 'reference/2023/09/GettyImages-591403975-2000-cefac25d0aa14fe9b83d626eada25b00.webp',
    target: 'public/images/categories/towels.webp',
  },
]

const LOGO_SOURCE = 'reference/2026/01/jaftradinglogo.webp'

const unresolved: ImageManifest['unresolved'] = []

function log(message: string): void {
  process.stdout.write(`${message}\n`)
}

function ensureDirectory(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true })
}

function fileBytes(path: string): number {
  try {
    return statSync(path).size
  } catch {
    return 0
  }
}

/** Reads the mirrored uploads tree once so lookups are case-insensitive. */
const reference = createReferenceIndex(join(projectRoot, 'reference'))

function absolute(relative: string): string {
  return join(projectRoot, relative)
}

/** Downloads a source asset, caching it under `reference/` for offline re-runs. */
async function fetchInto(referencePath: string, url: string): Promise<string | undefined> {
  if (offline) return undefined
  const destination = absolute(referencePath)
  const cached = reference.find(referencePath.replace(/^reference\//, ''))
  if (cached) return `reference/${cached}`

  try {
    const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(60_000) })
    if (!response.ok) return undefined
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength === 0) return undefined
    ensureDirectory(destination)
    writeFileSync(destination, buffer)
    return referencePath
  } catch {
    return undefined
  }
}

type ProcessOptions = {
  maxWidth: number
  /** Flatten transparency onto this colour (branded placeholders never need it). */
  flatten?: string
}

/** Encodes one source image into the optimised webp the site ships. */
async function encodeToWebp(source: string, target: string, options: ProcessOptions): Promise<GeneratedAsset | undefined> {
  const sourceAbsolute = absolute(source)
  const targetAbsolute = absolute(target)

  if (!existsSync(sourceAbsolute)) {
    unresolved.push({ url: source, reason: 'source file is missing' })
    return undefined
  }

  if (!force && existsSync(targetAbsolute) && statSync(targetAbsolute).mtimeMs >= statSync(sourceAbsolute).mtimeMs) {
    const metadata = await sharp(targetAbsolute).metadata()
    return {
      src: `/${posix.join(...target.split('/').slice(1))}`,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      bytes: fileBytes(targetAbsolute),
      source,
    }
  }

  try {
    let pipeline = sharp(sourceAbsolute, { failOn: 'none' }).rotate().resize({
      width: options.maxWidth,
      withoutEnlargement: true,
      fit: 'inside',
    })
    if (options.flatten) pipeline = pipeline.flatten({ background: options.flatten })
    const { data, info } = await pipeline.webp({ quality: WEBP_QUALITY, effort: 5 }).toBuffer({ resolveWithObject: true })
    ensureDirectory(targetAbsolute)
    writeFileSync(targetAbsolute, data)
    return {
      src: `/${posix.join(...target.split('/').slice(1))}`,
      width: info.width,
      height: info.height,
      bytes: data.byteLength,
      source,
    }
  } catch (error) {
    unresolved.push({ url: source, reason: `encode failed: ${(error as Error).message}` })
    return undefined
  }
}

/** The branded placeholder used wherever genuine photography does not exist. */
async function writeProductPlaceholder(): Promise<string | null> {
  const target = 'public/images/placeholders/product-placeholder.webp'
  const targetAbsolute = absolute(target)
  if (!force && existsSync(targetAbsolute)) return `/${target.replace(/^public\//, '')}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b3157"/>
      <stop offset="55%" stop-color="#08284b"/>
      <stop offset="100%" stop-color="#061f3b"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#f6efe6" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#f6efe6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="1200" fill="url(#sheen)"/>
  <rect width="1200" height="1200" fill="url(#glow)"/>
  <rect x="64" y="64" width="1072" height="1072" fill="none" stroke="#f6efe6" stroke-opacity="0.18" stroke-width="2"/>
  <path d="M600 300 v0" />
  <text x="600" y="560" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="184" letter-spacing="10" fill="#f6efe6" fill-opacity="0.92">JAF</text>
  <rect x="470" y="612" width="260" height="3" fill="#d34c0f"/>
  <text x="600" y="690" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" letter-spacing="12" fill="#f6efe6" fill-opacity="0.78">GLOBAL TRADING</text>
  <text x="600" y="820" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="27" letter-spacing="4" fill="#f6efe6" fill-opacity="0.55">Photography coming soon</text>
</svg>`

  try {
    const { data, info } = await sharp(Buffer.from(svg)).webp({ quality: 88, effort: 5 }).toBuffer({ resolveWithObject: true })
    ensureDirectory(targetAbsolute)
    writeFileSync(targetAbsolute, data)
    log(`  placeholder  ${target} (${info.width}x${info.height})`)
    return `/${target.replace(/^public\//, '')}`
  } catch (error) {
    log(`  placeholder FAILED: ${(error as Error).message}`)
    return null
  }
}

/** Default Open Graph card, built from the real logo and the live meta tagline. */
async function writeOgImage(logo: GeneratedAsset | null): Promise<string | null> {
  const target = 'public/images/brand/og-default.webp'
  const targetAbsolute = absolute(target)
  if (!force && existsSync(targetAbsolute)) return `/${target.replace(/^public\//, '')}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b3157"/>
      <stop offset="100%" stop-color="#061f3b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="#f6efe6" stroke-opacity="0.16" stroke-width="2"/>
  <text x="600" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="96" letter-spacing="16" fill="#f6efe6">JAF GLOBAL TRADING</text>
  <rect x="520" y="342" width="160" height="3" fill="#d34c0f"/>
  <text x="600" y="420" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#f6efe6" fill-opacity="0.8">Luxury Bath Towels, Bathrobes &amp; Bedding</text>
</svg>`
  try {
    const { data } = await sharp(Buffer.from(svg)).webp({ quality: 88, effort: 5 }).toBuffer({ resolveWithObject: true })
    ensureDirectory(targetAbsolute)
    writeFileSync(targetAbsolute, data)
    log(`  og image     ${target}${logo ? ` (logo: ${logo.src})` : ''}`)
    return `/${target.replace(/^public\//, '')}`
  } catch (error) {
    log(`  og image FAILED: ${(error as Error).message}`)
    return null
  }
}

function findExportCsv(): string {
  const directory = absolute('reference')
  const match = readdirSync(directory)
    .filter((name) => name.startsWith('wc-product-export-') && name.endsWith('.csv'))
    .sort()
    .pop()
  if (!match) throw new Error('No WooCommerce export found in reference/')
  return join(directory, match)
}

function legacySlugs(): Array<{ slug: string; seoTitle?: string }> {
  const raw = JSON.parse(readFileSync(absolute('data/legacy-seo.json'), 'utf8')) as Record<
    string,
    { kind: string; title?: string }
  >
  return Object.entries(raw)
    .filter(([, value]) => value.kind === 'product')
    .map(([url, value]) => ({
      slug: url.replace(/^https?:\/\/[^/]+\/product\//, '').replace(/\/$/, ''),
      seoTitle: value.title,
    }))
}

async function main(): Promise<void> {
  const csvPath = findExportCsv()
  const { rows } = readWooExport(readFileSync(csvPath, 'utf8'))
  const mapping = mapRowsToLegacySlugs(rows, legacySlugs())

  log(`Image migration — ${rows.length} products, ${reference.size} mirrored files available`)
  log(`Export: ${csvPath.replace(`${projectRoot}/`, '')}`)

  const manifest: ImageManifest = {
    generatedAt: new Date().toISOString(),
    products: {},
    brand: { logo: null, heroBanners: [], heroVideo: null, heroImages: [], featuredPromo: null, ogImage: null },
    categories: {},
    content: { images: {}, videos: {} },
    placeholders: { product: null, ogImage: null },
    unresolved: [],
    totals: { productImages: 0, bytes: 0, productsWithoutImages: 0 },
  }

  // 1. Brand assets -------------------------------------------------------
  log('\nBrand assets')
  const logo = await encodeToWebp(LOGO_SOURCE, 'public/images/brand/jaftrading-logo.webp', { maxWidth: 444 })
  if (logo) {
    manifest.brand.logo = logo
    log(`  logo         ${logo.src} ${logo.width}x${logo.height}`)
  } else {
    unresolved.push({ url: LOGO_SOURCE, reason: 'logo missing from the reference mirror' })
  }

  for (const banner of HERO_BANNERS) {
    const cachePath = `reference/_cdn/${banner.file}`
    const source = (await fetchInto(cachePath, `${CDN_ROOT}/${banner.file}`)) ?? cachePath
    if (!existsSync(absolute(source))) {
      unresolved.push({ url: `${CDN_ROOT}/${banner.file}`, reason: 'hero banner unavailable' })
      continue
    }
    const asset = await encodeToWebp(source, banner.target, { maxWidth: BANNER_MAX_WIDTH })
    if (asset) {
      manifest.brand.heroBanners.push(asset)
      log(`  hero banner  ${asset.src} ${asset.width}x${asset.height}`)
    }
  }

  const heroVideoCache = `reference/_cdn/${HERO_VIDEO.file}`
  let heroVideoSource = existsSync(absolute(heroVideoCache)) ? heroVideoCache : undefined
  for (const url of HERO_VIDEO.urls) {
    if (heroVideoSource) break
    heroVideoSource = await fetchInto(heroVideoCache, url)
  }
  heroVideoSource ??= heroVideoCache
  if (existsSync(absolute(heroVideoSource))) {
    const targetAbsolute = absolute(HERO_VIDEO.target)
    if (force || !existsSync(targetAbsolute)) {
      ensureDirectory(targetAbsolute)
      writeFileSync(targetAbsolute, readFileSync(absolute(heroVideoSource)))
    }
    manifest.brand.heroVideo = {
      src: `/${HERO_VIDEO.target.replace(/^public\//, '')}`,
      bytes: fileBytes(targetAbsolute),
      source: heroVideoSource,
    }
    log(`  hero video   ${manifest.brand.heroVideo.src} (${(manifest.brand.heroVideo.bytes / 1024 / 1024).toFixed(1)} MB)`)
  } else {
    unresolved.push({ url: `${CDN_ROOT}/${HERO_VIDEO.file}`, reason: 'hero video unavailable' })
  }

  for (const hero of HERO_IMAGES) {
    if (!existsSync(absolute(hero.source))) {
      unresolved.push({ url: hero.source, reason: 'hero photograph missing from the reference mirror' })
      continue
    }
    const asset = await encodeToWebp(hero.source, hero.target, { maxWidth: BANNER_MAX_WIDTH })
    if (asset) {
      manifest.brand.heroImages.push(asset)
      log(`  hero image   ${asset.src} ${asset.width}x${asset.height}`)
    }
  }

  let promoSource = existsSync(absolute(FEATURED_PROMO.cache)) ? FEATURED_PROMO.cache : undefined
  promoSource ??= await fetchInto(FEATURED_PROMO.cache, FEATURED_PROMO.url)
  if (promoSource && existsSync(absolute(promoSource))) {
    // Copied through, not re-encoded: the CDN original is already an optimised
    // 800x800 webp, and a second encode costs ~38 dB of fidelity for nothing.
    const targetAbsolute = absolute(FEATURED_PROMO.target)
    ensureDirectory(targetAbsolute)
    writeFileSync(targetAbsolute, readFileSync(absolute(promoSource)))
    const metadata = await sharp(targetAbsolute).metadata()
    manifest.brand.featuredPromo = {
      src: `/${posix.join(...FEATURED_PROMO.target.split('/').slice(1))}`,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      bytes: fileBytes(targetAbsolute),
      source: promoSource,
    }
    log(`  featured     ${manifest.brand.featuredPromo.src} ${metadata.width}x${metadata.height}`)
  } else {
    unresolved.push({ url: FEATURED_PROMO.url, reason: 'featured promo photograph unavailable' })
  }

  // 2. Category banners ---------------------------------------------------
  log('\nCategory banners')
  for (const banner of CATEGORY_BANNERS) {
    if (!existsSync(absolute(banner.reference))) {
      unresolved.push({ url: banner.reference, reason: 'category banner missing from the reference mirror' })
      continue
    }
    const asset = await encodeToWebp(banner.reference, banner.target, { maxWidth: CATEGORY_MAX_WIDTH })
    if (asset) {
      manifest.categories[banner.path] = asset
      log(`  ${banner.path.padEnd(22)} ${asset.src} ${asset.width}x${asset.height}`)
    }
  }

  // 3. In-content media ---------------------------------------------------
  log('\nProduct content media')
  for (const asset of CONTENT_ASSETS) {
    const fileName = asset.url.split('/').pop() ?? 'asset'
    const cachePath = `reference/_cdn/${fileName}`
    let source: string | undefined = existsSync(absolute(cachePath)) ? cachePath : undefined
    for (const url of asset.urls ?? [asset.url]) {
      if (source) break
      source = await fetchInto(cachePath, url)
    }
    if (!source || !existsSync(absolute(source))) {
      unresolved.push({ url: asset.url, reason: 'content asset unavailable' })
      continue
    }
    const targetAbsolute = absolute(asset.target)
    if (asset.video) {
      if (force || !existsSync(targetAbsolute)) {
        ensureDirectory(targetAbsolute)
        writeFileSync(targetAbsolute, readFileSync(absolute(source)))
      }
      const src = `/${asset.target.replace(/^public\//, '')}`
      // Dimensions travel with the film so the player can reserve the right box
      // before `preload="none"` ever fetches the metadata.
      const dimensions = readMp4Dimensions(targetAbsolute)
      manifest.content.videos[asset.url] = {
        src,
        bytes: fileBytes(targetAbsolute),
        source,
        ...(dimensions ?? {}),
      }
      log(
        `  video        ${src} (${(fileBytes(targetAbsolute) / 1024 / 1024).toFixed(1)} MB` +
          `${dimensions ? `, ${dimensions.width}x${dimensions.height}` : ''})`,
      )
      continue
    }
    const encoded = await encodeToWebp(source, asset.target, { maxWidth: asset.maxWidth ?? CONTENT_MAX_WIDTH })
    if (encoded) {
      manifest.content.images[asset.url] = encoded
      log(`  infographic  ${encoded.src} ${encoded.width}x${encoded.height}`)
    }
  }

  // 4. Placeholders -------------------------------------------------------
  log('\nPlaceholders')
  manifest.placeholders.product = await writeProductPlaceholder()
  manifest.placeholders.ogImage = await writeOgImage(logo ?? null)

  // 5. Product photography ------------------------------------------------
  log('\nProduct photography')
  for (const row of rows) {
    const match = mapping.byRow.get(row)
    if (!match) continue
    const slug = match.slug
    const assets: GeneratedAsset[] = []
    const seen = new Set<string>()
    let index = 0

    for (const url of row.imageUrls) {
      if (seen.has(url)) continue
      seen.add(url)
      const relative = uploadPathFromUrl(url)
      if (!relative) {
        unresolved.push({ url, product: row.name, reason: 'not a WordPress upload URL' })
        continue
      }

      const resolved = reference.resolve(relative)
      let source = resolved ? `reference/${resolved}` : undefined
      if (!source) {
        const fetched = await fetchInto(`reference/${relative}`, url)
        if (fetched) source = fetched
      }
      if (!source || !existsSync(absolute(source))) {
        unresolved.push({ url, product: row.name, reason: 'source asset is gone (404 on the live site)' })
        continue
      }

      index += 1
      const target = `public/images/products/${slug}/${String(index).padStart(2, '0')}.webp`
      const asset = await encodeToWebp(source, target, { maxWidth: PRODUCT_MAX_WIDTH })
      if (asset) assets.push(asset)
    }

    manifest.products[slug] = assets
    manifest.totals.productImages += assets.length
    manifest.totals.bytes += assets.reduce((total, asset) => total + asset.bytes, 0)
    if (assets.length === 0) manifest.totals.productsWithoutImages += 1
  }

  manifest.unresolved = unresolved

  const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`
  log(`  ${plural(manifest.totals.productImages, 'image')} across ${plural(rows.length, 'product')}`)
  log(`  ${manifest.totals.productsWithoutImages} products have no usable source photography (placeholder applies)`)
  log(`  ${(manifest.totals.bytes / 1024 / 1024).toFixed(1)} MB of optimised product imagery`)

  const bySlug = Object.entries(manifest.products)
  const fullyImaged = bySlug.filter(([, assets]) => assets.length >= 2).length
  const partially = bySlug.filter(([, assets]) => assets.length === 1).length
  log(`  coverage: ${fullyImaged} fully imaged, ${partially} partially imaged, ${manifest.totals.productsWithoutImages} none`)

  ensureDirectory(absolute('data/image-manifest.json'))
  writeFileSync(absolute('data/image-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  log(`\nWrote data/image-manifest.json — ${manifest.unresolved.length} unresolved source URLs`)
}

await main()
