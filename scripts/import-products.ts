#!/usr/bin/env node
/**
 * Turns the WooCommerce export into the normalised catalogue the site renders.
 *
 * Reads  : reference/wc-product-export-*.csv   (source of truth for product data)
 *          data/legacy-seo.json                (real slugs + harvested SEO metadata)
 *          data/image-manifest.json            (written by migrate-product-images.ts)
 * Writes : data/products.json, data/categories.json, data/data-quality.json
 *
 * Rules carried over from the audit: real legacy slugs are preserved, missing
 * prices stay missing ("Ask for Price"), no fact is invented, and every
 * questionable source value is reported instead of quietly corrected.
 *
 * Run: npm run data:products   (after npm run data:images)
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { categoryOrder } from '../lib/content/navigation.ts'
import { mapRowsToLegacySlugs } from '../lib/catalogue/legacy-slugs.ts'
import { parseProductContent } from '../lib/catalogue/product-content.ts'
import { readWooExport, type WooRow } from '../lib/catalogue/woo-export.ts'
import type {
  Catalogue,
  Category,
  CategoryRef,
  CategoryTree,
  ContentImage,
  DataQualityIssue,
  DataQualityReport,
  FeatureBullet,
  ImageManifest,
  Product,
  ProductAttribute,
  SpecRow,
} from '../types/catalogue.ts'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const absolute = (relative: string): string => join(projectRoot, relative)
const log = (message: string): void => {
  process.stdout.write(`${message}\n`)
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(absolute(relativePath), 'utf8')) as T
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

type LegacySeoFile = Record<string, { kind: string; title?: string; description?: string }>

const slugOf = (url: string, kind: 'product' | 'product-category' | ''): string =>
  kind === 'product'
    ? url.replace(/^https?:\/\/[^/]+\/product\//, '').replace(/\/$/, '')
    : url.replace(/^https?:\/\/[^/]+\/product-category\//, '').replace(/\/$/, '')

/** `Bath Towel` → `bath-towel`, matching the slugs the live URLs already use. */
function slugifySegment(segment: string): string {
  return segment
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function categoryRefs(row: WooRow, index: Map<string, Category>): CategoryRef[] {
  const refs: CategoryRef[] = []
  const seen = new Set<string>()
  for (const rawPath of row.categories) {
    const segments = rawPath
      .split('>')
      .map((segment) => segment.trim())
      .filter(Boolean)
    let path = ''
    segments.forEach((segment, depth) => {
      const slug = slugifySegment(segment)
      path = path ? `${path}/${slug}` : slug
      if (seen.has(path)) return
      const category = index.get(path)
      if (!category) throw new Error(`Unknown category path "${path}" (from "${rawPath}")`)
      seen.add(path)
      refs.push({ slug, name: category.name, path, depth })
    })
  }
  return refs
}

function dedupeSpecs(specs: SpecRow[]): SpecRow[] {
  const byLabel = new Map<string, SpecRow>()
  for (const spec of specs) {
    const key = spec.label.toLowerCase()
    const existing = byLabel.get(key)
    if (!existing) {
      byLabel.set(key, spec)
      continue
    }
    if (!existing.value.toLowerCase().includes(spec.value.toLowerCase())) {
      byLabel.set(key, { label: existing.label, value: `${existing.value}, ${spec.value}` })
    }
  }
  return [...byLabel.values()]
}

function dedupeFeatures(features: FeatureBullet[]): FeatureBullet[] {
  const seen = new Set<string>()
  return features.filter((feature) => {
    const key = `${feature.title ?? ''}|${feature.text}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function facetValue(specs: SpecRow[], labels: string[]): string | undefined {
  for (const label of labels) {
    const spec = specs.find((row) => row.label.toLowerCase() === label)
    if (spec?.value) return spec.value
  }
  return undefined
}

async function main(): Promise<void> {
  if (!existsSync(absolute('data/image-manifest.json'))) {
    throw new Error('data/image-manifest.json is missing — run `npm run data:images` first')
  }

  const csvPath = findExportCsv()
  const { rows, warnings } = readWooExport(readFileSync(csvPath, 'utf8'))
  const legacySeo = readJson<LegacySeoFile>('data/legacy-seo.json')
  const manifest = readJson<ImageManifest>('data/image-manifest.json')

  const legacyProducts = Object.entries(legacySeo)
    .filter(([, value]) => value.kind === 'product')
    .map(([url, value]) => ({ slug: slugOf(url, 'product'), seoTitle: value.title }))
  const legacyCategories = new Map(
    Object.entries(legacySeo)
      .filter(([, value]) => value.kind === 'category')
      .map(([url, value]) => [slugOf(url, ''), value]),
  )

  const mapping = mapRowsToLegacySlugs(rows, legacyProducts)
  const issues: DataQualityIssue[] = []

  // ---- categories -------------------------------------------------------
  const categories = new Map<string, Category>()
  for (const row of rows) {
    for (const rawPath of row.categories) {
      const segments = rawPath
        .split('>')
        .map((segment) => segment.trim())
        .filter(Boolean)
      let path = ''
      segments.forEach((segment, depth) => {
        const slug = slugifySegment(segment)
        const parentPath = path
        path = path ? `${path}/${slug}` : slug
        if (categories.has(path)) return
        const seo = legacyCategories.get(path)
        categories.set(path, {
          slug,
          name: segment,
          path,
          parentPath: parentPath || undefined,
          depth,
          children: [],
          productCount: 0,
          totalProductCount: 0,
          seo: { title: seo?.title, description: seo?.description },
        })
      })
    }
  }

  const unknownCategories = [...categories.keys()].filter((path) => !legacyCategories.has(path))
  if (unknownCategories.length > 0) {
    throw new Error(`Category paths without a legacy URL: ${unknownCategories.join(', ')}`)
  }
  const unusedLegacyCategories = [...legacyCategories.keys()].filter((path) => !categories.has(path))
  for (const path of unusedLegacyCategories) {
    issues.push({
      severity: 'warning',
      code: 'category-without-products',
      message: `Legacy category /product-category/${path}/ has no products in the export; the page will render an empty state.`,
    })
  }

  // ---- products ---------------------------------------------------------
  const products: Product[] = rows.map((row) => {
    const match = mapping.byRow.get(row)
    if (!match) throw new Error(`No slug for ${row.name}`)
    const slug = match.slug

    const shortParsed = parseProductContent(row.shortDescriptionHtml)
    const longParsed = row.descriptionHtml.trim() ? parseProductContent(row.descriptionHtml) : undefined
    const specs = dedupeSpecs([...shortParsed.specs, ...(longParsed?.specs ?? [])])
    const features = dedupeFeatures([...shortParsed.features, ...(longParsed?.features ?? [])])

    const intro = shortParsed.intro ?? longParsed?.intro
    const bodyParagraphs = [
      ...shortParsed.bodyParagraphs,
      ...(longParsed ? [longParsed.intro, ...longParsed.bodyParagraphs] : []),
    ].filter((paragraph): paragraph is string => Boolean(paragraph) && paragraph !== intro)

    const rawContentImages = [...shortParsed.contentImages, ...(longParsed?.contentImages ?? [])]
    const contentImages: ContentImage[] = []
    for (const image of rawContentImages) {
      const asset = manifest.content.images[image.src]
      if (!asset) {
        issues.push({
          severity: 'warning',
          code: 'content-image-unavailable',
          message: `In-content image could not be migrated: ${image.src}`,
          product: row.name,
          slug,
        })
        continue
      }
      if (contentImages.some((existing) => existing.src === asset.src)) continue
      contentImages.push({
        src: asset.src,
        width: asset.width,
        height: asset.height,
        alt: image.alt || `${row.name} — product information`,
      })
    }

    const rawVideos = [...shortParsed.videos, ...(longParsed?.videos ?? [])]
    const videos: Product['videos'] = []
    for (const video of rawVideos) {
      const asset = manifest.content.videos[video.src]
      if (!asset) {
        issues.push({
          severity: 'warning',
          code: 'content-video-unavailable',
          message: `In-content video could not be migrated: ${video.src}`,
          product: row.name,
          slug,
        })
        continue
      }
      if (videos.some((existing) => existing.src === asset.src)) continue
      videos.push({ src: asset.src, width: asset.width, height: asset.height })
    }

    for (const note of new Set([...shortParsed.notes, ...(longParsed?.notes ?? [])])) {
      issues.push({
        severity: 'info',
        code: 'content-markup',
        message: `${note} — content was flattened to text/features.`,
        product: row.name,
        slug,
      })
    }

    const attributes: ProductAttribute[] = row.attributes
    const images = (manifest.products[slug] ?? []).map((asset, index) => ({
      src: asset.src,
      width: asset.width,
      height: asset.height,
      alt: index === 0 ? row.name : `${row.name} — view ${index + 1}`,
    }))

    const refs = categoryRefs(row, categories)
    const primaryCategory = refs.reduce<CategoryRef | undefined>(
      (deepest, ref) => (!deepest || ref.depth > deepest.depth ? ref : deepest),
      undefined,
    )

    const sizeFromAttributes = attributes.find((attribute) => attribute.name.toLowerCase() === 'size')?.values.join(', ')
    const facets = {
      color: facetValue(specs, ['color', 'colour']),
      gsm: facetValue(specs, ['gsm']),
      size: facetValue(specs, ['size', 'sizes']) ?? sizeFromAttributes,
      material: facetValue(specs, ['material', 'base material', 'fabric', 'fabric type']),
    }

    const seo = legacySeo[`${'https://jaftradings.com'}/product/${slug}/`]
    if (!seo?.title) {
      issues.push({
        severity: 'warning',
        code: 'missing-legacy-seo',
        message: 'No harvested SEO title for this product; metadata falls back to the product name.',
        product: row.name,
        slug,
      })
    }
    if (!match.score || match.score < 0.6) {
      issues.push({
        severity: 'info',
        code: 'slug-match-low-confidence',
        message: `Slug matched with low confidence (${match.score.toFixed(2)}) — review data/data-quality.json.`,
        product: row.name,
        slug,
      })
    }

    if (!row.inStock) {
      issues.push({
        severity: 'info',
        code: 'not-in-stock',
        message: 'The export marks this product as out of stock; availability must be confirmed before purchase.',
        product: row.name,
        slug,
      })
    }
    if (images.length === 0) {
      issues.push({
        severity: 'warning',
        code: 'no-product-imagery',
        message:
          'No genuine source photography exists (the old URLs are broken); the branded placeholder is shown instead.',
        product: row.name,
        slug,
      })
    }

    return {
      id: row.id || slug,
      slug,
      sku: row.sku,
      name: row.name,
      intro,
      features,
      specs,
      bodyParagraphs,
      contentImages,
      videos,
      regularPricePKR: row.regularPricePKR,
      salePricePKR: row.salePricePKR,
      categories: refs,
      primaryCategory,
      tags: row.tags,
      images,
      attributes,
      featured: row.featured,
      inStock: row.inStock || true,
      seo: { title: seo?.title, description: seo?.description },
      facets,
    }
  })

  // ---- category counts --------------------------------------------------
  for (const product of products) {
    const covered = new Set<string>()
    for (const ref of product.categories) {
      // every ancestor prefix, so totals include descendants
      const segments = ref.path.split('/')
      for (let index = 1; index <= segments.length; index += 1) covered.add(segments.slice(0, index).join('/'))
    }
    for (const path of covered) {
      const category = categories.get(path)
      if (category) category.totalProductCount += 1
    }
    const leaf = product.primaryCategory
    if (leaf) {
      const category = categories.get(leaf.path)
      if (category) category.productCount += 1
    }
  }

  for (const category of categories.values()) {
    category.children = [...categories.values()]
      .filter((candidate) => candidate.parentPath === category.path)
      .sort((a, b) => categoryOrder.indexOf(a.path) - categoryOrder.indexOf(b.path))
      .map((candidate) => candidate.path)
  }

  const orderedCategories = [...categories.values()].sort((a, b) => {
    const left = categoryOrder.indexOf(a.path)
    const right = categoryOrder.indexOf(b.path)
    if (left === -1 || right === -1) return a.path.localeCompare(b.path)
    return left - right
  })

  // ---- data quality -----------------------------------------------------

  // Two products sharing their entire long-form content is a source-data fault
  // worth surfacing (the audit suspected it for the black leggings listings).
  const contentGroups = new Map<string, Product[]>()
  for (const product of products) {
    const signature = JSON.stringify({
      intro: product.intro ?? '',
      features: product.features,
      specs: product.specs,
      body: product.bodyParagraphs,
    })
    if (signature === JSON.stringify({ intro: '', features: [], specs: [], body: [] })) continue
    const group = contentGroups.get(signature) ?? []
    group.push(product)
    contentGroups.set(signature, group)
  }
  for (const group of contentGroups.values()) {
    if (group.length < 2) continue
    issues.push({
      severity: 'info',
      code: 'duplicate-content',
      message: `${group.length} products share identical description content — likely a copy/paste in the old catalogue: ${group.map((product) => product.slug).join(' | ')}`,
    })
  }

  // Harvested metadata that names a colour the product itself does not mention
  // points at a mismatched export row; report it rather than rewriting the copy.
  // Colour aliases are grouped: the source mixes spellings such as Mahroon/Maroon.
  const COLOUR_GROUPS = [
    ['black'],
    ['white'],
    ['grey', 'gray'],
    ['blue'],
    ['red'],
    ['pink'],
    ['purple'],
    ['cream'],
    ['sand'],
    ['lilac'],
    ['ruby'],
    ['maroon', 'mahroon'],
    ['yellow'],
    ['teal'],
    ['fuchsia', 'fushia'],
  ]
  const mentions = (text: string, group: string[]): boolean =>
    group.some((colour) => new RegExp(`\\b${colour}\\b`).test(text))

  for (const product of products) {
    const harvestedText = `${product.seo.title ?? ''} ${product.seo.description ?? ''}`.toLowerCase()
    const ownText = `${product.name} ${product.facets.color ?? ''} ${product.specs.map((spec) => spec.value).join(' ')}`.toLowerCase()
    for (const group of COLOUR_GROUPS) {
      if (!mentions(harvestedText, group)) continue
      if (mentions(ownText, group)) continue
      issues.push({
        severity: 'warning',
        code: 'metadata-colour-mismatch',
        message: `Harvested metadata mentions "${group[0]}", which this product does not: ${product.name}`,
        product: product.name,
        slug: product.slug,
      })
      break
    }
  }

  for (const warning of warnings) {
    // A product with no published price is a known, deliberate state — it is
    // listed as it should be, so the report treats it as information, not a fault.
    const severity = /Suspiciously low/.test(warning)
      ? 'critical'
      : /No price in source/.test(warning)
        ? 'info'
        : 'warning'
    issues.push({
      severity,
      code: /No price in source/.test(warning)
        ? 'no-source-price'
        : /Missing SKU/.test(warning)
          ? 'missing-sku'
          : 'source-export',
      message: warning,
    })
  }

  const withPrice = products.filter((product) => product.regularPricePKR !== undefined || product.salePricePKR !== undefined)
  const report: DataQualityReport = {
    generatedAt: new Date().toISOString(),
    counts: {
      products: products.length,
      withPrice: withPrice.length,
      onSale: products.filter((product) => product.salePricePKR !== undefined).length,
      withSku: products.filter((product) => product.sku).length,
      withSpecs: products.filter((product) => product.specs.length > 0).length,
      withImages: products.filter((product) => product.images.length > 0).length,
      withoutImages: products.filter((product) => product.images.length === 0).length,
    },
    issues,
    slugMatches: rows.map((row) => {
      const match = mapping.byRow.get(row)
      return {
        name: row.name,
        slug: match?.slug ?? '',
        score: match?.score ?? 0,
        method: match?.method ?? 'score',
      }
    }),
  }

  const catalogue: Catalogue = { generatedAt: new Date().toISOString(), products }
  const tree: CategoryTree = { generatedAt: catalogue.generatedAt, categories: orderedCategories }

  writeFileSync(absolute('data/products.json'), `${JSON.stringify(catalogue, null, 2)}\n`)
  writeFileSync(absolute('data/categories.json'), `${JSON.stringify(tree, null, 2)}\n`)
  writeFileSync(absolute('data/data-quality.json'), `${JSON.stringify(report, null, 2)}\n`)

  log(`Imported ${products.length} products into data/products.json`)
  log(`  priced: ${report.counts.withPrice} (of which ${report.counts.onSale} on sale) · ask-for-price: ${products.length - report.counts.withPrice}`)
  log(`  SKUs: ${report.counts.withSku} · spec tables: ${report.counts.withSpecs} · with photography: ${report.counts.withImages}`)
  log(`  categories: ${orderedCategories.length} across ${new Set(orderedCategories.map((c) => c.depth)).size} levels`)

  log('\nSlug matches that need a human eye (score < 0.75):')
  for (const match of report.slugMatches) {
    if (match.method === 'override' || match.score < 0.75) {
      log(`  [${match.score.toFixed(2)}] ${match.name.slice(0, 58).padEnd(58)} → ${match.slug}`)
    }
  }

  const critical = issues.filter((issue) => issue.severity === 'critical')
  log(`\nData-quality issues: ${issues.length} (${critical.length} critical) → data/data-quality.json`)
  for (const issue of critical) log(`  !! ${issue.message}`)
}

await main()
