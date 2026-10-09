import Link from 'next/link'
import {
  BedSingle,
  Footprints,
  Layers,
  LayoutGrid,
  PersonStanding,
  Shirt,
  Sparkles,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TrousersIcon } from '@/components/catalogue/trousers-icon'

export type CategoryChip = {
  path: string
  label: string
  /** Built by the page so the chip keeps every other active filter. */
  href: string
  active: boolean
}

/** A glyph per leaf category, keyed by path; anything else gets the grid mark. */
const CHIP_ICONS: Record<string, LucideIcon> = {
  'bath/towels/bath-towel': Waves,
  'bath/towels/bathrobes': Shirt,
  'bath/bath-slippers': Footprints,
  'bedding/sheet-pillow-cases': BedSingle,
  'bedding/blankets-throws': Layers,
  'bath/towels/shower-wrap': Sparkles,
  leggings: PersonStanding,
  // lucide has no trousers mark, so this one is drawn locally.
  trousers: TrousersIcon as unknown as LucideIcon,
}

/**
 * The horizontal category rail under the shop banner. Each chip is a real link
 * that adds (or, when already active, clears) the category filter, so the rail
 * works without JavaScript and every state has a shareable URL.
 */
export function CategoryChips({ items }: { items: CategoryChip[] }) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Shop by category" className="border-b border-border bg-white">
      <div className="container-page flex gap-2.5 overflow-x-auto py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const Icon = CHIP_ICONS[item.path] ?? LayoutGrid
          return (
            <Link
              key={item.path}
              href={item.href}
              aria-current={item.active ? 'true' : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-200 ${
                item.active
                  ? 'border-navy bg-navy text-white'
                  : 'border-border bg-white text-ink-soft hover:border-navy/40 hover:text-navy'
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
