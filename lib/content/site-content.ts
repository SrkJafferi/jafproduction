/**
 * Editorial content, lifted word-for-word from the live storefront during the
 * audit (`/`, `/about-us/`, `/contact-us/`).
 *
 * Nothing here is rewritten or invented: no ratings, review counts, badges,
 * certifications or statistics were added, because none were published.
 */

export type Faq = {
  question: string
  answer: string
}

export type Testimonial = {
  quote: string
  author: string
  role: string
  /**
   * Optional author portrait. No customer photographs were published, so this
   * is normally absent and the card falls back to a monogram of the author's
   * initials. Drop a real, permissioned portrait in here when one exists.
   */
  avatar?: string
}

/** The homepage headline statement — the live page's `h1` and its supporting copy. */
export const brandStatement = {
  heading: 'The JAF Global Trading Difference',
  body: 'JAF Global Trading is proud to bring beautiful, sustainably produced, luxurious linens to our home. Our bed sheets, bath towels and bathrobes are safe for everyone, even people with allergies, skin sensitivities, and respiratory issues. Our products are free from allergenic, carcinogenic, & toxic materials and chemicals, from the beginning of the supply chain to your front doorstep. you can rest easy knowing that you and your family are wrapped up in thoughtfully manufactured products every step of the way.',
}

/**
 * The three "collection" blocks the live homepage is built around, each pointing
 * at the real category it showcases.
 */
export const collections = [
  {
    id: 'bedding-collection',
    heading: 'Bedding Collection',
    anchor: 'For Bed',
    body: "Cosy, Warm, Crisp, & fresh Bed Sheets: Smooth Satin to adapt to each bed in any season Cool in the summer and warm in the winter. It's more gentle on the skin",
    categoryPath: 'bedding',
    categoryHref: '/product-category/bedding/',
  },
  {
    id: 'bath-slipper-collection',
    heading: 'Bath Slipper Collection',
    anchor: 'For Feet',
    body: "JAF Bath Slippers are soft and comfortable against the skin, making it an excellent choice for bath slippers. It helps prevent irritation and discomfort. It's highly absorbent and can help soak up moisture from your feet, keeping them dry and preventing slipper odor.",
    categoryPath: 'bath/bath-slippers',
    categoryHref: '/product-category/bath/bath-slippers/',
  },
  {
    id: 'hair-wrap-collection',
    heading: 'Hair Wrap Turban',
    anchor: 'For Hair',
    body: 'You love your hair, we love your hair, your hair deserves a little treat. Why not give it the JAF Hair Wrap Turban? This gentle, highly absorbent hair towel will speed up your drying time while being nicer to your hair - think less breakage and split ends. It will also keep your hair securely out of the way while you get ready, unlike a classic cotton towel. Love that.',
    categoryPath: 'bath/towels/shower-wrap',
    categoryHref: '/product-category/bath/towels/shower-wrap/',
  },
] as const

/** "Why Choose JAF Global Trading?" — the four closing paragraphs of the live pages. */
export const whyChooseGlobal = [
  'Our warehouse is located in different countries around the world, where all orders and other customer needs are handled on a daily basis, allowing us to engage with and fulfill our clients’ and customers’ demands, ensuring satisfaction and exposure to world-class items. JAF Global Trading provides world-class service and luxurious products that everyone can enjoy, built on the promise of meeting our clients’ and customers’ needs, as well as ingrained with historic techniques but with a modern taste.',
  'Sustainability, impact, community. Her story reflects the fundamental pillars of JAF Global Trading. The company’s mission statements and visions aren’t just corporate speak; they are how we live our lives when we are not at work. Our core values weren’t born out of a branding session; they are a part of who we are as humans and are at the heart of every decision we make.',
  'It’s why our textiles do not contain allergenic, carcinogenic, or toxic chemicals commonly used in conventional cotton textile production. As a result, our products are ideal for people with allergies, skin sensitivities, and respiratory problems.',
  'It’s why our customers can not only feel good about their purchase but also know it will last. Oh yeah, and they feel good to snuggle with… just like JAF Global Trading.',
]

export const aboutUs = {
  heading: 'Who we are?',
  paragraphs: [
    'JAF Global Trading is a premium supplier of high-quality home textile and apparel essentials, committed to delivering comfort, durability, and elegance in every product. We specialize in a wide range of carefully selected items including premium bedsheets, bathrobes, towels, bath slippers, leggings, kitchen towels, and trousers.',
    'Our products are designed to meet modern lifestyle needs by combining superior materials, fine craftsmanship, and long-lasting quality. Whether for home use, hospitality, retail, or bulk supply, JAF Global Trading ensures every item reflects our standards of comfort and reliability.',
    'We focus on quality control, customer satisfaction, and competitive pricing, making us a trusted partner for businesses and individuals alike. At JAF Global Trading, comfort is not just a feature — it is our promise.',
  ],
}

/** "Why Choose JAF Trading" — the five points published on the About page. */
export const whyChooseTrading: Array<{ icon: string; title: string; text: string }> = [
  {
    icon: '🛒',
    title: 'Premium Quality Products',
    text: 'We use carefully selected materials and strict quality standards to ensure superior comfort, durability, and performance in every product.',
  },
  {
    icon: '💰',
    title: 'Reliable Bulk & Wholesale Supply',
    text: 'JAF Trading is equipped to handle bulk orders with consistent quality, timely delivery, and competitive pricing.',
  },
  {
    icon: '📦',
    title: 'Wide Product Range',
    text: 'From bedsheets and bathrobes to towels, slippers, leggings, kitchen towels, and trousers — we offer complete home and apparel essentials under one roof.',
  },
  {
    icon: '🧑‍💻',
    title: '24/7 Customer Support',
    text: 'Our professional and friendly customer service team is always here to help — ensuring that every query is resolved promptly and to your satisfaction.',
  },
  {
    icon: '✔️',
    title: 'Trusted & Professional Partner',
    text: 'Our commitment to quality, transparency, and long-term relationships makes JAF Trading a reliable choice for retailers, hotels, and businesses.',
  },
]

export const aboutContact = {
  heading: 'Contact Us',
  paragraphs: [
    'JAF Global Trading puts in great effort to give customers and users smooth shopping experiences accompanied with rapid shipping, round-the-clock customer support representative, secure payment alternatives, and more. Look no further If you wish to find an exquisite present or want to enhance the current state of the house. Our aim is clear: to deliver high quality products alongside unparalleled customer service for an experience that always makes customers happy to shop with us.',
    'We are located in Karachi, so consider contacting us at +92 321-840-7252 or email us at info@jaftradings.com',
    'With JAF Trading, customer happiness takes priority and we strive to maintain strong customer relationships. There are no more reasons left to wait! Check us out now and enjoy the most astonishing deals in online shopping.',
  ],
}

export const contactPage = {
  heading: 'Get in touch',
  formHeading: 'Drop Us A Line',
  note: 'If you have any questions, please feel free to get in touch with us. We will reply to you as soon as possible. Thank you!',
}

export const faqs: Faq[] = [
  {
    question: 'What materials are your products made from?',
    answer:
      'All JAF Global Trading products — including our bath towels, bathrobes, bedding, and hair wrap turbans — are crafted from 100% premium cotton. Our fabrics are free from allergenic, carcinogenic, and toxic materials, making them safe for individuals with allergies, sensitive skin, and respiratory conditions.',
  },
  {
    question: 'Do you offer wholesale or bulk orders for businesses?',
    answer:
      'Yes. We proudly supply hotels, spas, resorts, and retailers with bulk orders of bath towels, bathrobes, bedding sets, and more. For wholesale pricing and minimum order quantities, please contact our team through our Contact Us page.',
  },
  {
    question: 'Are your products safe for sensitive skin and allergies?',
    answer:
      'Absolutely. Our entire product range is hypoallergenic and manufactured without harmful chemicals — from the raw material stage all the way to your doorstep. This makes our linens ideal for people with allergies, eczema, and respiratory sensitivities.',
  },
  {
    question: 'What sizes and GSM options are available for bath towels and bathrobes?',
    answer:
      'Our bath towels are available in premium 550 GSM cotton, while our bathrobes range from 400-450 GSM in Terry, Zero Twist, and Waffle styles. Sizes range from Small to XLX for adults, with dedicated kids’ sizing also available. Full specifications are listed on each individual product page.',
  },
  {
    question: 'Do you ship internationally, and what are the delivery times?',
    answer:
      'Yes, we deliver both locally and internationally. Delivery timelines vary based on your location and order size — please reach out via our Contact Us page for exact shipping estimates for your region.',
  },
  {
    question: 'How do I care for my JAF Global Trading towels and bathrobes?',
    answer:
      'For best results, machine wash in cold water with similar colors and tumble dry on low heat. Avoid bleach and fabric softeners, as these can reduce absorbency over time. Proper care helps maintain the softness and durability of your cotton linens for years to come.',
  },
]

export const testimonials: Testimonial[] = [
  {
    quote:
      'The bathrobes exceeded our expectations. The fabric feels premium, stitching is neat, and the quality has remained consistent across our orders. Very satisfied with the overall experience.',
    author: 'Sarah M.',
    role: 'Hotel Procurement Manager',
  },
  {
    quote:
      'We ordered towels and bathrobes for our guest rooms, and the feedback from our housekeeping team has been excellent. Comfortable, durable, and exactly what we were looking for.',
    author: 'Ahmed Raza',
    role: 'Resort Operations',
  },
  {
    quote:
      'The cotton quality is genuinely impressive. Soft, absorbent, and beautifully finished. Our clients notice the difference, and that’s what matters most.',
    author: 'Emily Tailor',
    role: 'Spa Owner',
  },
  {
    quote:
      'Professional communication, reliable delivery, and products that match the descriptions. It’s refreshing to work with a supplier that values consistency.',
    author: 'Daniel K',
    role: 'Hospitality Buyer',
  },
  {
    quote:
      'We requested samples before placing our bulk order, and the quality convinced us immediately. Everything arrived exactly as expected, and we’ll definitely order again.',
    author: 'Fatima Hafiz',
    role: 'Bolan Hotel',
  },
  {
    quote:
      'Finding a supplier that combines quality with competitive pricing isn’t easy. JAF Global Trading has been dependable from the first inquiry to final delivery.',
    author: 'Michael L.',
    role: 'Wholesale Customer',
  },
]
