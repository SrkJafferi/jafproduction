// One-time harvest of legacy Rank Math SEO metadata from the live WordPress site.
// Output: .audit/legacy-seo.json  (later moved into the project as data/legacy-seo.json)
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function fetchHtml(url) {
  try {
    return execFileSync('curl', ['-sL', '-A', UA, '--max-time', '45', url], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch {
    return ''
  }
}

const decode = (s = '') =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&#8230;/g, '…')
    .trim()

function meta(html) {
  const pick = (re) => decode((html.match(re) || [])[1] || '') || undefined
  return {
    title: pick(/<title>([\s\S]*?)<\/title>/i),
    description: pick(/<meta\s+name="description"\s+content="([^"]*)"/i),
    canonical: pick(/<link\s+rel="canonical"\s+href="([^"]*)"/i),
    ogTitle: pick(/<meta\s+property="og:title"\s+content="([^"]*)"/i),
    ogDescription: pick(/<meta\s+property="og:description"\s+content="([^"]*)"/i),
    ogImage: pick(/<meta\s+property="og:image"\s+content="([^"]*)"/i),
    h1: pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  }
}

const BASE = 'https://jaftradings.com'

// Product URLs come straight from the live product sitemap.
const sitemap = fetchHtml(`${BASE}/product-sitemap.xml`)
const productUrls = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)]
  .map((m) => m[1])
  .filter((u) => u.includes('/product/'))

const categoryPaths = [
  'bath',
  'bath/bath-slippers',
  'bath/towels',
  'bath/towels/bath-towel',
  'bath/towels/bathrobes',
  'bath/towels/bathrobes/kids-bathrobe',
  'bath/towels/face-towel',
  'bath/towels/hand-towel',
  'bath/towels/kitchen-towel',
  'bath/towels/shower-wrap',
  'bedding',
  'bedding/blankets-throws',
  'bedding/sheet-pillow-cases',
  'leggings',
  'trousers',
]

const targets = [
  ...['/', '/shop/', '/about-us/', '/contact-us/'].map((p) => ({ kind: 'page', url: BASE + p })),
  ...categoryPaths.map((p) => ({ kind: 'category', url: `${BASE}/product-category/${p}/` })),
  ...productUrls.map((u) => ({ kind: 'product', url: u })),
]

mkdirSync('.audit', { recursive: true })
const outPath = '.audit/legacy-seo.json'
const out = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {}

let i = 0
for (const t of targets) {
  i++
  if (out[t.url]?.title) {
    continue
  }
  const html = fetchHtml(t.url)
  if (!html) {
    console.log(`${i}/${targets.length} FAILED ${t.url}`)
    continue
  }
  out[t.url] = { kind: t.kind, ...meta(html) }
  console.log(`${i}/${targets.length} ${t.kind.padEnd(8)} ${out[t.url].title ?? '(no title)'}`)
  writeFileSync(outPath, JSON.stringify(out, null, 2))
}
console.log(`\nHarvested ${Object.keys(out).length} URLs -> ${outPath}`)
