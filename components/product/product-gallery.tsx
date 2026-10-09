'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { MediaImage } from '@/lib/catalogue/media'
import type { ProductImage } from '@/types/catalogue'

type ProductGalleryProps = {
  images: ProductImage[]
  productName: string
  placeholder: MediaImage
}

/**
 * Product gallery: the thumbnail rail beside the main frame on desktop, below it
 * on mobile. Both sit on the light page now, so the frames are white cards with
 * a hairline border rather than the old dark panels. No carousel dependency;
 * arrow-key support and the branded placeholder — with an honest explanation —
 * when the original photography no longer exists.
 */
export function ProductGallery({ images, productName, placeholder }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const thumbnails = useRef<Array<HTMLButtonElement | null>>([])

  if (images.length === 0) {
    return (
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-white">
          <Image
            src={placeholder.src}
            alt={`${productName} — photography coming soon`}
            fill
            priority
            sizes="(min-width: 1024px) 48vw, 92vw"
            className="object-contain p-6"
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          The original product photography for this item is no longer available on our old store. Ask us on WhatsApp and
          we will send current photos.
        </p>
      </div>
    )
  }

  const activeImage = images[Math.min(active, images.length - 1)]!

  const focusThumbnail = (index: number) => {
    const next = (index + images.length) % images.length
    setActive(next)
    thumbnails.current[next]?.focus()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[84px_1fr] lg:gap-5">
      {/* Thumbnail rail: a vertical column on desktop, a row on mobile. */}
      {images.length > 1 ? (
        <ul
          className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible lg:pb-0"
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              focusThumbnail(active + 1)
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              focusThumbnail(active - 1)
            }
          }}
        >
          {images.map((image, index) => (
            <li key={image.src} className="shrink-0">
              <button
                type="button"
                ref={(node) => {
                  thumbnails.current[index] = node
                }}
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === active}
                className={`relative block size-16 overflow-hidden rounded-lg border bg-white transition-colors duration-200 sm:size-18 lg:size-20 ${
                  index === active ? 'border-terracotta' : 'border-border hover:border-navy/40'
                }`}
              >
                <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative order-1 aspect-square overflow-hidden rounded-2xl border border-border bg-white lg:order-2">
        <Image
          key={activeImage.src}
          src={activeImage.src}
          alt={activeImage.alt}
          fill
          priority={active === 0}
          sizes="(min-width: 1024px) 44vw, 92vw"
          quality={85}
          className="object-contain p-4 sm:p-8"
        />
      </div>
    </div>
  )
}
