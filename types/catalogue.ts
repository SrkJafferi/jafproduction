/**
 * Shared, dependency-free types for the JAF Global Trading catalogue.
 *
 * Everything here describes the *normalised* shape produced by
 * `scripts/import-products.ts`. No WooCommerce-specific fields survive the
 * import, and no raw WordPress HTML reaches the runtime.
 */

/** A category a product belongs to, resolved to the live URL path. */
export type CategoryRef = {
  /** Leaf slug, e.g. `bath-towel`. */
  slug: string
  /** Display name exactly as it appears in WooCommerce, e.g. `Bath Towel`. */
  name: string
  /** Full path without leading/trailing slashes, e.g. `bath/towels/bath-towel`. */
  path: string
  /** Nesting depth, 0 for top-level. */
  depth: number
}

export type ProductImage = {
  /** Public path, e.g. `/images/products/<slug>/01.webp`. */
  src: string
  width: number
  height: number
  alt: string
}

/** One row of a product's specification table. */
export type SpecRow = {
  label: string
  value: string
}

/** A `✅ Title: body` bullet lifted out of the WooCommerce short description. */
export type FeatureBullet = {
  title?: string
  text: string
}

/** Long-form product media that lived inside the WooCommerce description. */
export type ProductVideo = {
  src: string
  /** Optional poster frame so the player never causes layout shift. */
  poster?: string
  /**
   * Display size of the film. The player uses it as a CSS `aspect-ratio` so a
   * portrait reel renders at its true shape instead of collapsing to the
   * browser's 300x150 default while `preload="none"` defers the metadata fetch.
   */
  width?: number
  height?: number
}

export type ContentImage = {
  src: string
  width: number
  height: number
  alt: string
}

export type ProductAttribute = {
  name: string
  values: string[]
}

export type ProductSeo = {
  title?: string
  description?: string
}

export type Product = {
  id: string
  /** Legacy WordPress slug — preserved so existing URLs keep working. */
  slug: string
  sku?: string
  name: string
  /** Opening prose from the short description, already plain text. */
  intro?: string
  features: FeatureBullet[]
  specs: SpecRow[]
  /** Long description prose, split into paragraphs. */
  bodyParagraphs: string[]
  /** Infographics that were embedded in the long description. */
  contentImages: ContentImage[]
  videos: ProductVideo[]
  /**
   * Canonical price in Pakistani Rupees. `undefined` means "Ask for Price" —
   * it is never zero, never guessed, never derived from another product.
   */
  regularPricePKR?: number
  salePricePKR?: number
  categories: CategoryRef[]
  /** Deepest/most specific category, used for breadcrumbs and card eyebrows. */
  primaryCategory?: CategoryRef
  tags: string[]
  images: ProductImage[]
  attributes: ProductAttribute[]
  featured: boolean
  inStock: boolean
  seo: ProductSeo
  /** Facets derived from the spec table, used for filtering and sorting. */
  facets: {
    color?: string
    gsm?: string
    size?: string
    material?: string
  }
}

export type Category = {
  slug: string
  name: string
  /** Full path without slashes, e.g. `bath/towels`. */
  path: string
  parentPath?: string
  depth: number
  /** Paths of immediate children, in display order. */
  children: string[]
  /** Products assigned directly to this category. */
  productCount: number
  /** Products in this category or any descendant. */
  totalProductCount: number
  seo: ProductSeo
}

/** Everything `scripts/import-products.ts` writes to `data/`. */
export type Catalogue = {
  generatedAt: string
  products: Product[]
}

export type CategoryTree = {
  generatedAt: string
  categories: Category[]
}

/** One locally optimised asset written by the image migration. */
export type GeneratedAsset = {
  /** Public path, e.g. `/images/brand/hero-bathrobes.webp`. */
  src: string
  width: number
  height: number
  bytes: number
  /** Where the pixels came from, for traceability. */
  source: string
}

/** Everything `scripts/migrate-product-images.ts` writes to `data/image-manifest.json`. */
export type ImageManifest = {
  generatedAt: string
  products: Record<string, GeneratedAsset[]>
  brand: {
    logo: GeneratedAsset | null
    heroBanners: GeneratedAsset[]
    heroVideo: { src: string; bytes: number; source: string } | null
    /** The homepage hero photographs, in presentation order. */
    heroImages: GeneratedAsset[]
    featuredPromo: GeneratedAsset | null
    ogImage: GeneratedAsset | null
  }
  /** Keyed by category path, e.g. `bath/towels/bathrobes`. */
  categories: Record<string, GeneratedAsset>
  /** In-content infographics, keyed by the original URL used in the old storefront. */
  content: {
    images: Record<string, GeneratedAsset>
    videos: Record<string, { src: string; bytes: number; source: string; width?: number; height?: number }>
  }
  placeholders: { product: string | null; ogImage: string | null }
  unresolved: Array<{ url: string; product?: string; reason: string }>
  totals: { productImages: number; bytes: number; productsWithoutImages: number }
}

/** A single data-quality observation, surfaced on an internal report only. */
export type DataQualityIssue = {
  severity: 'info' | 'warning' | 'critical'
  code: string
  message: string
  product?: string
  slug?: string
}

export type DataQualityReport = {
  generatedAt: string
  counts: {
    products: number
    withPrice: number
    onSale: number
    withSku: number
    withSpecs: number
    withImages: number
    withoutImages: number
  }
  issues: DataQualityIssue[]
  /** Export row → legacy slug, so the mapping can be reviewed by a human. */
  slugMatches: Array<{ name: string; slug: string; score: number; method: 'score' | 'override' }>
}
