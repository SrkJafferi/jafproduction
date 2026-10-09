/**
 * WhatsApp is the storefront's only commerce channel, so every enquiry URL is
 * built here — one place to change the number, one message format to maintain.
 *
 * The message always states which price the shopper saw *and* the canonical PKR
 * price, so a converted figure can never be mistaken for the agreed one.
 */

import { siteConfig } from '@/lib/site-config'

/** `https://wa.me/<number>?text=<encoded message>` */
export function whatsAppUrl(message: string): string {
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`
}

export type ProductEnquiry = {
  productName: string
  productUrl: string
  sku?: string
  /** Formatted price in the currency the shopper is viewing, when one exists. */
  displayedPrice?: string
  /** Formatted canonical price, always in PKR, when one exists. */
  basePricePKR?: string
}

export function buildProductEnquiryMessage(enquiry: ProductEnquiry): string {
  const lines = [
    `Hello ${siteConfig.name},`,
    '',
    "I'm interested in:",
    '',
    `Product: ${enquiry.productName}`,
  ]

  if (enquiry.sku) lines.push(`SKU: ${enquiry.sku}`)

  if (enquiry.displayedPrice) lines.push(`Displayed Price: ${enquiry.displayedPrice}`)
  if (enquiry.basePricePKR) lines.push(`Base Price: ${enquiry.basePricePKR}`)
  if (!enquiry.displayedPrice && !enquiry.basePricePKR) lines.push('Price: Please confirm')

  lines.push(`Product URL: ${enquiry.productUrl}`, '', 'Please share availability and ordering details.')

  return lines.join('\n')
}

export function productEnquiryUrl(enquiry: ProductEnquiry): string {
  return whatsAppUrl(buildProductEnquiryMessage(enquiry))
}

/** Generic "talk to us" entry point used by the header, footer and float button. */
export function generalEnquiryUrl(context?: string): string {
  const message = [
    `Hello ${siteConfig.name},`,
    '',
    context ? `I'd like to ask about ${context}.` : "I'd like to ask about your products.",
    '',
    'Please share availability and ordering details.',
  ].join('\n')
  return whatsAppUrl(message)
}

export function wholesaleEnquiryUrl(): string {
  const message = [
    `Hello ${siteConfig.name},`,
    '',
    'I would like to discuss a wholesale or bulk order.',
    '',
    'Please share your pricing, minimum order quantities and delivery details.',
  ].join('\n')
  return whatsAppUrl(message)
}
