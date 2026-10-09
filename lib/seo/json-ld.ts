/**
 * JSON-LD built only from facts the site actually holds.
 *
 * There are deliberately no ratings, review counts, awards or certifications —
 * the source site publishes none and inventing them would be both dishonest and
 * a structured-data violation. Products without a source price get no `Offer` at
 * all rather than a fabricated one.
 */

import { siteConfig } from '@/lib/site-config'
import { effectivePricePKR, getCategory } from '@/lib/catalogue'
import type { Faq } from '@/lib/content/site-content'
import type { Category, Product } from '@/types/catalogue'

type JsonLd = Record<string, unknown>

export function organisationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: `${siteConfig.url}/`,
    logo: `${siteConfig.url}${siteConfig.media.logo}`,
    image: `${siteConfig.url}${siteConfig.media.ogImage}`,
    description: siteConfig.description,
    email: siteConfig.contact.emails.general,
    telephone: siteConfig.contact.phoneE164,
    address: {
      '@type': 'PostalAddress',
      addressLocality: siteConfig.contact.address.locality,
      addressCountry: siteConfig.contact.address.countryCode,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: siteConfig.contact.phoneE164,
        email: siteConfig.contact.emails.general,
        availableLanguage: ['en'],
      },
    ],
    sameAs: siteConfig.socials.map((social) => social.href),
  }
}

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    url: `${siteConfig.url}/`,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: 'en',
    publisher: { '@id': `${siteConfig.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/shop/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbJsonLd(trail: Array<{ name: string; href: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: `${siteConfig.url}${entry.href}`,
    })),
  }
}

export function productJsonLd(product: Product): JsonLd {
  const price = effectivePricePKR(product)
  const category = product.primaryCategory ? getCategory(product.primaryCategory.path) : undefined

  const base: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.seo.description || product.intro
      ? { description: product.seo.description ?? product.intro }
      : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.images.length > 0 ? { image: product.images.map((image) => `${siteConfig.url}${image.src}`) } : {}),
    ...(category ? { category: category.name } : {}),
    url: `${siteConfig.url}/product/${product.slug}/`,
    brand: { '@type': 'Brand', name: siteConfig.name },
    ...(product.specs.length > 0
      ? {
          additionalProperty: product.specs.map((spec) => ({
            '@type': 'PropertyValue',
            name: spec.label,
            value: spec.value,
          })),
        }
      : {}),
    // Availability is only asserted when the source export lists the product as
    // in stock *and* a price exists to order it at.
    ...(price.amount !== undefined
      ? {
          offers: {
            '@type': 'Offer',
            url: `${siteConfig.url}/product/${product.slug}/`,
            price: price.amount,
            priceCurrency: 'PKR',
            availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@id': `${siteConfig.url}/#organization` },
          },
        }
      : {}),
  }

  return base
}

export function faqJsonLd(faqs: Faq[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

export function categoryJsonLd(category: Category): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.seo.title ?? `${category.name} | ${siteConfig.name}`,
    description: category.seo.description,
    url: `${siteConfig.url}/product-category/${category.path}/`,
    isPartOf: { '@id': `${siteConfig.url}/#website` },
  }
}
