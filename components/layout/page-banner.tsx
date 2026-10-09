import Image from 'next/image'
import { Breadcrumbs, type Crumb } from '@/components/ui/breadcrumbs'

type PageBannerProps = {
  title: string
  trail: Crumb[]
  /** Background photo: a genuine JAF banner, dimmed under the navy overlay. */
  image?: { src: string; alt: string }
}

/**
 * The dark page-title band the live store puts above shop, category and
 * product pages: a photographic banner under a navy scrim, the page title
 * centred, breadcrumbs beneath it.
 */
export function PageBanner({ title, trail, image }: PageBannerProps) {
  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-navy-deep">
      {image ? (
        <Image
          src={image.src}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={70}
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-navy-deep/80" aria-hidden />

      <div className="relative container-page flex flex-col items-center gap-2 py-12 text-center lg:py-16">
        <h1 className="max-w-3xl text-2xl leading-snug font-medium text-white sm:text-[1.75rem]">{title}</h1>
        <Breadcrumbs trail={trail} tone="onDark" />
      </div>
    </section>
  )
}
