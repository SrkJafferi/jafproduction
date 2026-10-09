import type { SVGProps } from 'react'

/**
 * A trousers mark.
 *
 * lucide-react has no trousers glyph — its only garment icon is `Shirt`, which is
 * what the Trousers chip used to borrow, making it a duplicate of Bathrobes. This
 * is drawn to the same spec as a lucide icon (24x24 box, 2px stroke, round caps
 * and joins, `currentColor`) so it sits beside them without standing out.
 */
export function TrousersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* Waist, hips flaring to the hems, and the notch between the legs. */}
      <path d="M6.5 3h11l1.5 4-1 14h-4l-2-11.5L10 21H6L5 7Z" />
    </svg>
  )
}
