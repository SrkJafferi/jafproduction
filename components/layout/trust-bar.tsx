import { Award, Package, ShieldCheck, Truck } from 'lucide-react'

/**
 * The four service promises the shop closes with. The copy is the About page's
 * own "Why choose JAF Trading" points, so the shop does not invent a second set
 * of claims.
 */
const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Premium Quality Products',
    text: 'Carefully selected materials and strict quality standards on every product.',
  },
  {
    icon: Truck,
    title: 'Worldwide Shipping',
    text: 'We deliver both locally and internationally, in retail and bulk quantities.',
  },
  {
    icon: Package,
    title: 'Reliable Bulk Supply',
    text: 'Equipped for wholesale volumes with consistent quality and timely delivery.',
  },
  {
    icon: Award,
    title: 'Trusted Partner',
    text: 'A dependable choice for retailers, hotels and businesses.',
  },
]

export function TrustBar() {
  return (
    <section aria-label="Why buy from JAF Global Trading" className="border-t border-border bg-surface-muted">
      <ul className="container-page grid gap-6 py-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {TRUST_POINTS.map((point) => (
          <li key={point.title} className="flex items-start gap-3.5">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-terracotta/12 text-terracotta"
              aria-hidden
            >
              <point.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-semibold text-navy">{point.title}</p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">{point.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
