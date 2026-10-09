import Image from 'next/image'
import type { ReactNode } from 'react'
import { Check, HandCoins, Leaf, MoveDiagonal } from 'lucide-react'
import { Price } from '@/components/currency/price'
import type { FeatureBullet, Product, SpecRow } from '@/types/catalogue'

/**
 * Specification table. The design gives the label column its own tint and rules
 * every row, so the block reads as a spec sheet rather than a list.
 */
export function SpecTable({ specs }: { specs: SpecRow[] }) {
  if (specs.length === 0) return null

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full border-collapse text-[0.9375rem]">
        <caption className="sr-only">Product specifications</caption>
        <tbody className="divide-y divide-border">
          {specs.map((spec) => (
            <tr key={spec.label}>
              <th scope="row" className="w-2/5 bg-surface-muted px-4 py-3 text-left font-semibold text-navy">
                {spec.label}
              </th>
              <td className="bg-white px-4 py-3 text-ink-soft">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * The source data carries feature bullets either as a separate `title` field or
 * baked into the text as "Title: body". Both are split here so the design can
 * print the title bold on its own line.
 */
function splitFeature(feature: FeatureBullet): { title?: string; text: string } {
  if (feature.title) return { title: feature.title, text: feature.text }

  const match = /^([^:]{2,60}):\s+([\s\S]+)$/.exec(feature.text)
  const title = match?.[1]
  const rest = match?.[2]
  if (title && rest) return { title, text: rest }

  return { text: feature.text }
}

/** The feature bullets, each ticked off and titled as the design shows them. */
export function FeatureList({ features }: { features: FeatureBullet[] }) {
  if (features.length === 0) return null

  return (
    <ul className="space-y-4">
      {features.map((feature, index) => {
        const { title, text } = splitFeature(feature)
        return (
          <li key={`${title ?? ''}-${index}`} className="flex gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-terracotta" aria-hidden strokeWidth={2.5} />
            <div className="min-w-0">
              {title ? <p className="font-semibold text-navy">{title}</p> : null}
              <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink-soft">{text}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The price block. Priced products show the live price treatment; unpriced ones
 * get the honest "Ask for Price" panel the design uses, never a zero.
 */
export function PricePanel({
  regularPricePKR,
  salePricePKR,
}: {
  regularPricePKR?: number
  salePricePKR?: number
}) {
  const priced = regularPricePKR !== undefined || salePricePKR !== undefined

  return (
    <div className="flex items-start gap-4 rounded-2xl bg-cream p-5">
      <HandCoins className="mt-0.5 size-7 shrink-0 text-terracotta" aria-hidden />
      <div className="min-w-0">
        {priced ? (
          <Price regularPricePKR={regularPricePKR} salePricePKR={salePricePKR} variant="detail" />
        ) : (
          <>
            <p className="text-xl font-semibold text-terracotta sm:text-[1.375rem]">Ask for Price</p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">
              Ask on WhatsApp — we confirm availability and pricing directly.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function FactCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-navy"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.6875rem] tracking-[0.16em] text-muted uppercase">{label}</p>
        <p className="mt-0.5 truncate text-[0.9375rem] text-navy">{value}</p>
      </div>
    </div>
  )
}

/** The Material / Size cards that close the summary panel. */
export function ProductFacts({ material, size }: { material?: string; size?: string }) {
  if (!material && !size) return null

  return (
    <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
      {material ? <FactCard label="Material" value={material} icon={<Leaf className="size-5" />} /> : null}
      {size ? <FactCard label="Size" value={size} icon={<MoveDiagonal className="size-5" />} /> : null}
    </div>
  )
}

/**
 * The product film that lived inside the old description. The player is lazy —
 * `preload="none"` — so it costs nothing until a visitor actually presses play.
 *
 * The films are portrait reels (720x1280), the same shape as the homepage
 * "Products Reels" band. A full-width player would run the page into a screen and
 * a half, so a portrait film is capped to the reel width; landscape and square
 * clips keep the wide frame. The real aspect ratio is applied either way —
 * without it a `preload="none"` player has no intrinsic size and collapses to the
 * browser's 300x150 default box until the metadata is fetched.
 *
 * Rendered on its own so the caller decides where it sits — the product page
 * places it as a column beside "Key features".
 */
export function ProductFilm({ videos, className }: { videos: Product['videos']; className?: string }) {
  if (videos.length === 0) return null

  return (
    <div className={className}>
      {videos.map((video) => {
        const hasSize = Boolean(video.width && video.height)
        const portrait = hasSize && (video.height as number) > (video.width as number)

        return (
          <div key={video.src} className={portrait ? 'mx-auto w-full max-w-sm' : 'w-full max-w-2xl'}>
            <video
              className="block w-full rounded-xl border border-border bg-navy-deep"
              style={hasSize ? { aspectRatio: `${video.width} / ${video.height}` } : undefined}
              src={video.src}
              poster={video.poster}
              controls
              preload="none"
              playsInline
            >
              Your browser does not support embedded video.
            </video>
          </div>
        )
      })}
    </div>
  )
}

/**
 * The infographics that lived inside the old description. The product film is not
 * here — it renders beside "Key features", so it would otherwise appear twice.
 */
export function ProductMedia({ product }: { product: Product }) {
  if (product.contentImages.length === 0) return null

  return (
    <section className="mt-12 border-t border-border pt-10" aria-labelledby="product-media-heading">
      <h2 id="product-media-heading" className="text-xl font-medium text-navy">
        Product information
      </h2>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {product.contentImages.map((image) => (
          <figure key={image.src} className="overflow-hidden rounded-xl border border-border bg-surface-muted">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 48vw, 92vw"
              className="h-auto w-full object-contain"
            />
          </figure>
        ))}
      </div>
    </section>
  )
}
