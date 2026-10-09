/**
 * Maps each WooCommerce export row onto the *real* legacy WordPress slug.
 *
 * The export has no slug column, and slugifying the product titles would break
 * live URLs (several products have historical slugs that no longer match their
 * title). So the mapping is derived from data we genuinely hold:
 *
 *  - `data/legacy-seo.json` — the real slugs, harvested from the live product
 *    sitemap, each with its Rank Math SEO title.
 *  - token overlap between the row name and both the slug and that SEO title.
 *
 * On top of the scoring sits a small, explicit override table (with reasons) for
 * pairs the scoring cannot separate — colour/size variants of one product line.
 * The result is validated as a *bijection*: every export row gets a distinct
 * slug and every legacy slug is used exactly once. Anything else throws, so a
 * silent mismatch can never reach the site.
 */

import type { WooRow } from './woo-export.ts'

export type SlugMatch = {
  slug: string
  score: number
  /** How the match was decided, for the data-quality report. */
  method: 'score' | 'override'
}

/** Rows the scorer cannot separate on its own — each with a human-checkable reason. */
const OVERRIDES: Array<{ sku?: string; name: string; slug: string; reason: string }> = [
  {
    name: 'Terry Bathrobe - 100% Cotton Terry Silky Soft Spa Quality Comfort – Shawl Collar & Pocket - Sky Blue',
    slug: 'bathrobe-100-cotton-terry-silky-soft-spa-quality-comfort-shawl-collar-pocket-ocean-blue-color-1-piece',
    reason:
      'The live URL keeps the original colour name ("ocean blue") while the export calls the same robe "Sky Blue"; title overlap is too low for scoring.',
  },
  {
    sku: 'leggings-black-1',
    name: 'Black Winter Supersoft Lycra Legging - Super Soft Cotton - Medium Size',
    slug: 'black-winter-supersoft-lycra-legging-super-soft-cotton-medium-size',
    reason: 'The 7-to-8-years variant shares almost every token; the size suffix is the only difference.',
  },
  {
    sku: 'legging-black',
    name: 'Black Winter Supersoft Lycra Legging - Super Soft Cotton - 7 to 8 Years Size',
    slug: 'black-winter-supersoft-lycra-legging-super-soft-cotton-7-to-8-years-size',
    reason: 'The medium-size variant shares almost every token; the size suffix is the only difference.',
  },
  {
    sku: 'flannel-blanket-220',
    name: 'High Quality Flannel Blanket 220 X 240 King Size-Supremo King Lilac',
    slug: 'high-quality-flannel-blanket-220-x-240-king-size-supremo-king-lilac',
    reason:
      'Two live URLs exist for the same blanket with reversed word order; this pairing follows the live title that matches the export word for word.',
  },
  {
    sku: 'bedsheet-red',
    name: 'Single Bed Size Microfiber Fitted Bedsheet with Pillow & Cushion Covers - 120*200*35 cm - Red',
    slug: 'single-bed-size-microfiber-fitted-bedsheet-with-pillow-cushion-covers-12020035-cm-red',
    reason: 'Two single-bed sheets differ only by colour, which the slug compresses; pinned by colour token.',
  },
]

const TRIVIAL = new Set([
  'the',
  'and',
  'with',
  'for',
  'size',
  'sizes',
  'cm',
  'inches',
  'inch',
  'years',
  'year',
  'to',
  'of',
  'in',
  'x',
  'pcs',
  'pc',
  'piece',
  'pieces',
  'set',
  'jaf',
  'global',
  'trading',
  'product',
  'our',
  'are',
  'made',
  'from',
])

const COLOR_TOKENS = new Set([
  'black',
  'white',
  'grey',
  'gray',
  'blue',
  'red',
  'pink',
  'purple',
  'cream',
  'sand',
  'lilac',
  'ruby',
  'mahroon',
  'maroon',
  'yellow',
  'teal',
  'fushia',
  'fuchsia',
  'natural',
  'blossom',
  'ocean',
  'sky',
  'royal',
  'striped',
  'stars',
  'strips',
  'hard',
])

/** Folds the punctuation/typography variations the export mixes together. */
export function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, '')
    .replace(/[\u2013\u2014]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokens(value: string): string[] {
  return normalise(value)
    .split(' ')
    .filter((token) => token.length > 1 && !TRIVIAL.has(token))
}

function weight(token: string): number {
  if (/^\d{3,}$/.test(token)) return 2.5 // 550, 380, 18020035 — dimensions and GSM
  if (COLOR_TOKENS.has(token)) return 2
  return 1
}

function jaccardWeighted(a: string[], b: string[]): number {
  const left = new Map<string, number>()
  for (const token of a) left.set(token, Math.max(left.get(token) ?? 0, weight(token)))
  const right = new Map<string, number>()
  for (const token of b) right.set(token, Math.max(right.get(token) ?? 0, weight(token)))

  let shared = 0
  let union = 0
  for (const key of new Set([...left.keys(), ...right.keys()])) {
    const l = left.get(key) ?? 0
    const r = right.get(key) ?? 0
    shared += Math.min(l, r)
    union += Math.max(l, r)
  }
  return union === 0 ? 0 : shared / union
}

/** Trailing colour/size words carry most of the signal between variants. */
function tailBonus(name: string, slug: string): number {
  const nameTail = new Set(tokens(name).slice(-4))
  const slugTail = new Set(tokens(slug.split('/').pop() ?? slug))
  let hits = 0
  for (const token of nameTail) if (slugTail.has(token)) hits += 1
  return hits >= 2 ? 0.08 : 0
}

function scorePair(row: WooRow, slug: string, seoTitle: string | undefined): number {
  const slugScore = jaccardWeighted(tokens(row.name), tokens(slug.replace(/-/g, ' ')))
  const titleScore = seoTitle ? jaccardWeighted(tokens(row.name), tokens(seoTitle)) : 0
  // The SEO title is a rewritten string, so it contributes but never dominates.
  return Math.max(slugScore, slugScore * 0.75 + titleScore * 0.4) + tailBonus(row.name, slug)
}

function overrideFor(row: WooRow): { slug: string; reason: string } | undefined {
  for (const override of OVERRIDES) {
    if (override.sku && row.sku === override.sku) return { slug: override.slug, reason: override.reason }
    if (override.name === row.name) return { slug: override.slug, reason: override.reason }
  }
  return undefined
}

export type SlugMapping = {
  byRow: Map<WooRow, SlugMatch>
  /** The override decisions, surfaced in the data-quality report. */
  overrides: Array<{ name: string; slug: string; reason: string }>
}

/**
 * Assigns every row a distinct legacy slug.
 *
 * Greedy global assignment (highest scoring pair first, each side used once)
 * rather than per-row best match, so two near-identical variants cannot both
 * claim the same URL.
 */
export function mapRowsToLegacySlugs(
  rows: WooRow[],
  legacySlugs: Array<{ slug: string; seoTitle?: string }>,
): SlugMapping {
  const slugSet = new Set(legacySlugs.map((entry) => entry.slug))
  const seoTitleBySlug = new Map(legacySlugs.map((entry) => [entry.slug, entry.seoTitle]))

  const byRow = new Map<WooRow, SlugMatch>()
  const usedSlugs = new Set<string>()
  const overrides: SlugMapping['overrides'] = []

  // 1. Pinned pairs first.
  for (const row of rows) {
    const override = overrideFor(row)
    if (!override) continue
    if (!slugSet.has(override.slug)) throw new Error(`Override points at an unknown legacy slug: ${override.slug}`)
    if (usedSlugs.has(override.slug)) throw new Error(`Two export rows claim the legacy slug ${override.slug}`)
    byRow.set(row, { slug: override.slug, score: 1, method: 'override' })
    usedSlugs.add(override.slug)
    overrides.push({ name: row.name, slug: override.slug, reason: override.reason })
  }

  // 2. Everything else by weighted token overlap.
  const candidates: Array<{ row: WooRow; slug: string; score: number }> = []
  for (const row of rows) {
    if (byRow.has(row)) continue
    for (const { slug } of legacySlugs) {
      if (usedSlugs.has(slug)) continue
      candidates.push({ row, slug, score: scorePair(row, slug, seoTitleBySlug.get(slug)) })
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))

  for (const candidate of candidates) {
    if (byRow.has(candidate.row) || usedSlugs.has(candidate.slug)) continue
    byRow.set(candidate.row, { slug: candidate.slug, score: candidate.score, method: 'score' })
    usedSlugs.add(candidate.slug)
  }

  // 3. Validate the bijection — a silent mismatch must never reach the site.
  const unmapped = rows.filter((row) => !byRow.has(row))
  if (unmapped.length > 0) {
    throw new Error(`No legacy slug assigned for: ${unmapped.map((row) => row.name).join(' | ')}`)
  }
  const leftover = [...slugSet].filter((slug) => !usedSlugs.has(slug))
  if (leftover.length > 0) {
    throw new Error(`Legacy slugs left unused: ${leftover.join(' | ')}`)
  }

  return { byRow, overrides }
}
