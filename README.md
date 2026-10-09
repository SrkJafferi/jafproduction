# JAF Global Trading — Next.js catalogue

A rebuild of **jaftradings.com** as a fast, Vercel-ready catalogue: same brand, same
products, same URLs, no WordPress and no WooCommerce at runtime.

Ordering happens on WhatsApp. There is deliberately **no cart, checkout, customer
account, payment gateway, CMS or application database.**

## Requirements

- Node.js 20.9+ (developed on Node 24)
- npm

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run data:images` | Image migration → `public/images/**`, `public/videos/**`, `data/image-manifest.json` |
| `npm run data:products` | Product import → `data/products.json`, `data/categories.json`, `data/data-quality.json` |
| `npm run data:all` | Both, in order (images first) |
| `npm run data:seo` | Re-harvests legacy SEO metadata from the live site (one-off, network) |

`data:images` accepts `--no-download` (stay entirely offline) and `--force` (re-encode
everything).

## Source of truth

Everything the site renders comes from three audited inputs, all committed:

| Input | What it is |
| --- | --- |
| `reference/wc-product-export-*.csv` | The WooCommerce export: 63 published products, prices, categories, tags, images |
| `data/legacy-seo.json` | Real legacy slugs + hand-written Rank Math titles/descriptions for 4 pages, 15 categories, 63 products |
| `reference/**` (git-ignored) | Local mirror of the old WordPress uploads — source material for the image migration only |

The export has no slug column, so `lib/catalogue/legacy-slugs.ts` maps every row onto
its **real** legacy slug (weighted token overlap against the slug and its SEO title,
plus an explicit override table for colour/size variants). The result is validated as a
bijection: every export row gets a distinct slug and every legacy slug is used exactly
once, or the import fails loudly.

## Architecture

```
app/                      routes (all static except /shop)
  page.tsx                homepage built from the real homepage content
  shop/                   catalogue with search, sort and price-state filters
  product/[slug]/         product detail (generateStaticParams for all 63 slugs)
  product-category/[...slug]/   legacy nested category URLs
  about-us/ contact-us/   harvested copy, real contact data
  api/exchange-rates/     cached FX endpoint (6h)
  sitemap.ts robots.ts not-found.tsx
components/               layout · home · catalogue · product · currency · whatsapp · ui
lib/
  site-config.ts          URL, phone, WhatsApp, emails, socials, address, hours, currencies
  content/                harvested navigation + editorial copy (FAQ, testimonials, about)
  catalogue/              CSV parsing, content parsing, slug mapping, media, loaders, pricing
  currency/ seo/ whatsapp/
scripts/                  migration + import (run with plain `node`, TS type-stripping)
types/catalogue.ts        the normalised data model
```

Rules the code holds to:

- **Prices**: PKR is canonical and stored only in PKR. A product with no source price is
  *not* priced — it renders "Ask for Price" and the enquiry asks for a quote. No figure
  is ever invented, and price sorts always push unpriced products to the end.
- **Content**: WooCommerce HTML is parsed at import time into typed data
  (`specs`, `features`, `bodyParagraphs`, content images, videos). No WordPress HTML is
  rendered with `dangerouslySetInnerHTML`.
- **Imagery**: local mirror → original source URL (fetched once, cached into
  `reference/`) → branded JAF placeholder. Never unrelated stock photography. 14
  products have no surviving photography and use the placeholder.
- **Business facts**: only what the live site publishes. No ratings, reviews, awards,
  certifications, customer counts or "viewing now" notices — the old theme's demo trust
  badges stay excluded.

## Currencies

PKR (default) plus USD, EUR, AUD and GBP. Conversion is display-only: rates come from
one cached endpoint (`/api/exchange-rates`, 6h) that tries `open.er-api.com` and falls
back to the `currency-api` JSON feed, validating each rate against a plausibility window.
If no provider answers, the site keeps working in PKR and the foreign options are
disabled rather than showing a guessed number. Converted figures are marked `≈` and the
product page always restates the PKR price; WhatsApp messages carry both.

> Note: the original plan named Frankfurter, but it does not publish PKR at all
> (`GET /v1/latest?base=PKR` → "not found"), so the feed is taken from providers that
> genuinely quote PKR.

Currency is remembered in `localStorage` and applied through `useSyncExternalStore`, so
the server and the first client render both show PKR (no hydration mismatch) and the
stored choice is applied immediately after.

## SEO

- Legacy slugs preserved verbatim; `trailingSlash: true` matches the old URLs.
- Harvested Rank Math titles and descriptions are reused as absolute titles.
- `sitemap.xml` lists all 82 real URLs (4 pages + 15 categories + 63 products).
- `/category/*` → `/product-category/*`, and the retired WooCommerce pages redirect to
  `/shop/` or `/contact-us/`.
- JSON-LD: Organization, WebSite (with SearchAction), BreadcrumbList, CollectionPage,
  Product with `Offer` **only when a real price exists**, and FAQPage.
- Filtered catalogue views are excluded from the index (`robots.txt` disallows `/*?`).

## Performance notes

- 86 of 87 routes are prerendered at build time; only `/shop` reads `searchParams`.
- Images are local, pre-optimised webp, served through `next/image` with explicit
  dimensions (no CLS) and only the first row marked `priority`.
- Video (hero film + product videos) uses `preload="none"` and only loads on play.
- Fonts are self-hosted by `next/font`; the client bundle is limited to the header
  drawer, currency selector/price, contact form and the product gallery.

## Data-quality items for the client to confirm

Generated by `npm run data:products` into `data/data-quality.json`:

1. **`Hair Wrap Turban (Yellow)` is priced PKR 10** in the source export — almost
   certainly wrong. It is left exactly as supplied and flagged as the only critical
   issue; it needs a real price.
2. **49 of 63 products have no published price.** They display "Ask for Price" until
   prices are supplied.
3. **The White Bath Towel's metadata mentions "sand"** while the product is white —
   a mismatched export row (flagged, not silently rewritten).
4. **Several products share identical description copy** (including both black leggings
   listings) — reported as `duplicate-content`.
5. **14 products have no usable photography** and 41 image URLs are gone from the live
   server too; they use the branded placeholder.
6. 13 products have no SKU in the export.

Nothing in this list is corrected automatically: the site reports it so the business can
decide, then the import is re-run.
