/**
 * Navigation harvested from the live storefront.
 *
 * The labels mirror the original menu (`HOME`, `OUR PRODUCTS`, `BATH`,
 * `BEDDINGS`, `TROUSERS`, `LEGGINGS`) and every href is an existing URL, so no
 * legacy path loses its place in the site hierarchy.
 */

export type NavLink = {
  label: string
  href: string
}

export type NavItem = NavLink & {
  /** Second-level links, exactly the ones nested under this item on the live site. */
  children?: NavLink[]
}

export const primaryNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Our Products', href: '/shop/' },
  {
    label: 'Bath',
    href: '/product-category/bath/',
    children: [
      { label: 'Bath Slippers', href: '/product-category/bath/bath-slippers/' },
      { label: 'Towels', href: '/product-category/bath/towels/' },
      { label: 'Bath Towel', href: '/product-category/bath/towels/bath-towel/' },
      { label: 'Bathrobes', href: '/product-category/bath/towels/bathrobes/' },
      { label: 'Kids Bathrobe', href: '/product-category/bath/towels/bathrobes/kids-bathrobe/' },
      { label: 'Face Towel', href: '/product-category/bath/towels/face-towel/' },
      { label: 'Hand Towel', href: '/product-category/bath/towels/hand-towel/' },
      { label: 'Kitchen Towel', href: '/product-category/bath/towels/kitchen-towel/' },
      { label: 'Shower Wrap', href: '/product-category/bath/towels/shower-wrap/' },
    ],
  },
  {
    label: 'Bedding',
    href: '/product-category/bedding/',
    children: [
      { label: 'Blankets & Throws', href: '/product-category/bedding/blankets-throws/' },
      { label: 'Sheet & Pillow Cases', href: '/product-category/bedding/sheet-pillow-cases/' },
    ],
  },
  { label: 'Trousers', href: '/product-category/trousers/' },
  { label: 'Leggings', href: '/product-category/leggings/' },
]

/**
 * The footer's "Customer Service" column. The design pairs it with a
 * "Quick Links" column that simply repeats `primaryNav`, so this holds only the
 * service and category shortcuts — every href is a real page, and `/#faqs`
 * targets the homepage accordion.
 */
export const footerNav: Array<{ heading: string; links: NavLink[] }> = [
  {
    heading: 'Customer Service',
    links: [
      { label: 'Contact Us', href: '/contact-us/' },
      { label: 'About Us', href: '/about-us/' },
      { label: 'Hair Wrap Turban', href: '/product-category/bath/towels/shower-wrap/' },
      { label: 'Bath Towels', href: '/product-category/bath/towels/bath-towel/' },
      { label: 'Bathrobes', href: '/product-category/bath/towels/bathrobes/' },
      { label: 'Sheet & Pillow Covers', href: '/product-category/bedding/sheet-pillow-cases/' },
      { label: 'Blankets & Throws', href: '/product-category/bedding/blankets-throws/' },
      { label: 'FAQs', href: '/#faqs' },
    ],
  },
]

/**
 * Display order for the category tree — the sequence the live menus use, so the
 * catalogue reads the same way it always has.
 */
export const categoryOrder: string[] = [
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
