/**
 * WordPress/WooCommerce HTML → structured, typed product content.
 *
 * The old storefront kept specifications, feature bullets, infographics and
 * videos inside a single HTML blob. The rebuild must never ship that blob to the
 * browser (no `dangerouslySetInnerHTML`), so everything is parsed here into
 * plain data the React components render as real elements.
 *
 * The parser is deliberately narrow: it understands the markup that actually
 * exists in the export (`<p>`, `<strong>`, `<ul>/<li>`, `<table>`, `<img>`,
 * `<video><source>`, the WordPress `[embed]` shortcode plus the `✅` bullet
 * convention) and reports anything else it meets in `notes` so the data-quality
 * report can flag it.
 */

import type { ContentImage, FeatureBullet, ProductVideo, SpecRow } from '../../types/catalogue.ts'

export type ParsedProductContent = {
  intro?: string
  features: FeatureBullet[]
  specs: SpecRow[]
  bodyParagraphs: string[]
  contentImages: Array<Omit<ContentImage, 'width' | 'height'> & { width?: number; height?: number }>
  videos: ProductVideo[]
  /** Structured markup the parser did not understand, for the quality report. */
  notes: string[]
}

const ENTITIES: Array<[RegExp, string]> = [
  [/&#0?39;|&apos;|&#8217;/g, '’'],
  [/&#8216;/g, '‘'],
  [/&#8220;/g, '“'],
  [/&#8221;/g, '”'],
  [/&#8211;/g, '–'],
  [/&#8212;/g, '—'],
  [/&#8230;|&hellip;/g, '…'],
  [/&nbsp;/g, ' '],
  [/&quot;/g, '"'],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&amp;/g, '&'],
]

/** Decodes the entity set that appears in the export (amp last, so `&amp;lt;` survives). */
export function decodeEntities(value: string): string {
  let output = value
  for (const [pattern, replacement] of ENTITIES) output = output.replace(pattern, replacement)
  return output
}

/** Collapses whitespace, trims, and removes the stray curl the export inserts. */
function cleanText(value: string): string {
  return decodeEntities(value.replace(/<br\s*\/?>/gi, ' '))
    .replace(/\s+/g, ' ')
    .replace(/\s*([,.;:!?])\s*/g, '$1 ')
    .replace(/^[\s•·\-–—]+/, '')
    .trim()
}

const stripTags = (value: string): string => cleanText(value.replace(/<[^>]*>/g, ' '))

function extractSpecs(html: string): { specs: SpecRow[]; rest: string } {
  const specs: SpecRow[] = []
  const rest = html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_match, body: string) => {
    const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
    for (const row of rows) {
      const cells = [...(row[1] ?? '').matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripTags(cell[1] ?? ''))
      const [label, ...values] = cells
      const value = values.join(' ').trim()
      if (!label || !value) continue
      const key = label.toLowerCase()
      const existing = specs.find((spec) => spec.label.toLowerCase() === key)
      if (existing) {
        if (!existing.value.toLowerCase().includes(value.toLowerCase())) existing.value = `${existing.value}, ${value}`
        continue
      }
      specs.push({ label, value })
    }
    return '\n'
  })
  return { specs, rest }
}

function extractMedia(html: string, notes: string[]): { rest: string; contentImages: ParsedProductContent['contentImages']; videos: ProductVideo[] } {
  const contentImages: ParsedProductContent['contentImages'] = []
  const videos: ProductVideo[] = []

  // WordPress `[embed]`/`[video]` shortcodes wrap a bare URL and must be lifted out
  // before any text normalisation runs: `cleanText` inserts a space after `:` and
  // `.` to tidy prose, which would corrupt the URL into `https: //cdn. example. com`.
  // Both the closed and the unclosed form occur in the export.
  const pushEmbed = (inner: string): string => {
    const url = inner.match(/https?:\/\/[^\s"'<>\]]+/i)?.[0]
    if (!url) {
      notes.push('Found an [embed] shortcode without a URL')
      return '\n'
    }
    videos.push({ src: url })
    return '\n'
  }

  let rest = html.replace(/\[embed\b[^\]]*\]([\s\S]*?)\[\/embed\]/gi, (_match, inner: string) => pushEmbed(inner))
  rest = rest.replace(/\[embed\b[^\]]*\]([^[]*)/gi, (_match, inner: string) => pushEmbed(inner))

  rest = rest.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/src\s*=\s*"([^"]+)"/i)?.[1]
    if (!src) {
      notes.push('Found an <img> without a src attribute')
      return ''
    }
    const width = Number.parseInt(tag.match(/width\s*=\s*"(\d+)"/i)?.[1] ?? '', 10)
    const height = Number.parseInt(tag.match(/height\s*=\s*"(\d+)"/i)?.[1] ?? '', 10)
    const alt = decodeEntities(tag.match(/alt\s*=\s*"([^"]*)"/i)?.[1] ?? '')
    contentImages.push({
      src: src.trim(),
      alt: alt.trim(),
      width: Number.isFinite(width) ? width : undefined,
      height: Number.isFinite(height) ? height : undefined,
    })
    return '\n'
  })

  rest = rest.replace(/<video\b[^>]*>([\s\S]*?)<\/video>/gi, (_match, inner: string) => {
    const src = inner.match(/<source[^>]*src\s*=\s*"([^"]+)"/i)?.[1] ?? inner.match(/src\s*=\s*"([^"]+)"/i)?.[1]
    if (!src) {
      notes.push('Found a <video> without a source')
      return '\n'
    }
    videos.push({ src: src.trim() })
    return '\n'
  })

  if (/<(h[1-6]|figure|blockquote|iframe)\b/i.test(rest)) {
    const tags = new Set([...rest.matchAll(/<(h[1-6]|figure|blockquote|iframe)\b/gi)].map((match) => (match[1] ?? '').toLowerCase()))
    notes.push(`Structured markup flattened: ${[...tags].join(', ')}`)
  }

  return { rest, contentImages, videos }
}

function toFeatureBullet(raw: string): FeatureBullet | undefined {
  // `✅ <strong>Title:</strong> text` and `✅ text without a title` both occur.
  const withoutMarker = raw.replace(/^[✅✔️\s]+/, '').trim()
  if (!withoutMarker) return undefined

  const titled = withoutMarker.match(/^<strong>([\s\S]*?)<\/strong>\s*([\s\S]*)$/i)
  if (titled) {
    const title = stripTags(titled[1] ?? '').replace(/[:.\s]+$/, '')
    const text = stripTags(`<strong></strong>${titled[2] ?? ''}`)
    if (!text) return title ? { title, text: '' } : undefined
    return { title: title || undefined, text }
  }

  const text = stripTags(withoutMarker)
  return text ? { text } : undefined
}

/** Parses one or more HTML blobs into the structured product content model. */
export function parseProductContent(html: string): ParsedProductContent {
  const notes: string[] = []
  const normalised = html.replace(/\r\n?/g, '\n')
  const { specs, rest: withoutTables } = extractSpecs(normalised)
  const { rest, contentImages, videos } = extractMedia(withoutTables, notes)

  // Drop the "Specifications:" caption that introduced the table.
  const body = rest.replace(/(^|\n)\s*(<strong>\s*)?Specifications\s*:?\s*(<\/strong>)?\s*(?=\n|$)/gi, '$1')

  const blocks: string[] = []
  for (const rawBlock of body.split(/\n{1,}/)) {
    const block = rawBlock.trim()
    if (!block) continue
    if (/^<li\b/i.test(block)) {
      for (const item of block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) if (item[1]) blocks.push(item[1])
      continue
    }
    // A line often holds several ✅ bullets.
    if (block.includes('✅')) {
      for (const part of block.split('✅')) if (part.trim()) blocks.push(`✅${part}`)
      continue
    }
    if (block.startsWith('<ul') || block.startsWith('<ol')) {
      for (const item of block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) if (item[1]) blocks.push(item[1])
      continue
    }
    blocks.push(block)
  }

  const features: FeatureBullet[] = []
  const prose: string[] = []
  for (const block of blocks) {
    const isBullet = block.startsWith('✅') || /^<(li|ul|ol)\b/i.test(block)
    if (isBullet) {
      const feature = toFeatureBullet(block)
      if (feature) features.push(feature)
      continue
    }
    const text = stripTags(block)
    if (text.length > 0) prose.push(text)
  }

  const [intro, ...bodyParagraphs] = prose
  if (notes.length > 0) {
    for (const note of notes) if (!notes.includes(note)) notes.push(note)
  }

  return {
    intro: intro || undefined,
    features,
    specs,
    bodyParagraphs: bodyParagraphs.filter((paragraph) => paragraph.length > 0),
    contentImages,
    videos,
    notes: [...new Set(notes)],
  }
}
