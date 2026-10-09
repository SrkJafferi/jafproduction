import Link from 'next/link'
import { WhatsAppGlyph } from '@/components/whatsapp/whatsapp-float'
import { primaryNav } from '@/lib/content/navigation'
import { generalEnquiryUrl } from '@/lib/whatsapp'

export default function NotFound() {
  return (
    <div className="container-page py-20 lg:py-28">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-3 max-w-2xl text-3xl leading-tight font-medium text-navy sm:text-4xl">
        That page is not part of the catalogue
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
        The link may be from an older version of the store. Here is where everything actually lives — or ask us directly
        and we will point you to it.
      </p>

      <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
        {primaryNav.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm font-medium tracking-[0.14em] text-navy uppercase transition-colors duration-200 hover:text-terracotta"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/shop/"
          className="btn bg-navy px-6 py-3.5 text-sm font-medium tracking-wide text-cream transition-colors duration-200 hover:bg-navy-soft"
        >
          Browse all products
        </Link>
        <a
          href={generalEnquiryUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn inline-flex items-center gap-2 border border-navy/25 px-6 py-3.5 text-sm font-medium tracking-wide text-navy transition-colors duration-200 hover:border-navy"
        >
          <WhatsAppGlyph className="size-4" />
          Ask on WhatsApp
        </a>
      </div>
    </div>
  )
}
