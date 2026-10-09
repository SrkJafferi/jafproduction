/**
 * Dependency-free reader for the WooCommerce product export that ships with the
 * project (`reference/wc-product-export-*.csv`).
 *
 * The file is a *one-time migration input*: nothing WooCommerce-shaped survives
 * into the app. Two quirks of the export are handled here:
 *
 *  1. Newlines inside fields are escaped as the literal characters `\r\n`
 *     (backslash, r, backslash, n) rather than being real line breaks.
 *  2. Quotes inside quoted fields are doubled (`""`) and the header starts with
 *     a UTF-8 BOM.
 */

export type WooAttribute = {
  name: string
  values: string[]
}

export type WooRow = {
  id: string
  type: string
  sku?: string
  /** Product name exactly as supplied. Never rewritten. */
  name: string
  published: boolean
  featured: boolean
  inStock: boolean
  shortDescriptionHtml: string
  descriptionHtml: string
  /** Canonical PKR price. `undefined` means the source has no usable price. */
  regularPricePKR?: number
  salePricePKR?: number
  /** Category paths as supplied, e.g. `Bath > Towels > Bath Towel`. */
  categories: string[]
  tags: string[]
  /** Absolute image URLs in WooCommerce gallery order. */
  imageUrls: string[]
  attributes: WooAttribute[]
}

export type WooExport = {
  rows: WooRow[]
  /** Non-fatal issues worth surfacing in the data-quality report. */
  warnings: string[]
}

/** Splits a CSV document into rows of raw field values. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/**
 * Turns the export's escaped newlines into real line breaks.
 *
 * WooCommerce writes `\r\n` as four literal characters so the value can survive
 * a single CSV row; the content parser downstream expects actual newlines.
 */
export function unescapeNewlines(value: string): string {
  return value.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\n')
}

/**
 * Reads a price cell. Returns `undefined` for blank/garbage input so callers can
 * fall back to "Ask for Price" instead of silently rendering PKR 0.
 */
export function parsePrice(value: string | undefined): number | undefined {
  if (!value) return undefined
  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '')
  if (!cleaned) return undefined
  const amount = Number.parseFloat(cleaned)
  if (!Number.isFinite(amount) || amount <= 0) return undefined
  return amount
}

const flag = (value: string | undefined): boolean => value === '1' || value?.toLowerCase() === 'yes'

/** Reads the export into normalised rows, collecting data-quality warnings. */
export function readWooExport(csvText: string): WooExport {
  const text = csvText.replace(/^\uFEFF/, '')
  const [headerRow, ...dataRows] = parseCsv(text)
  if (!headerRow) throw new Error('WooCommerce export is empty')

  const columns = headerRow.map((name) => name.trim())
  const column = (name: string): number => columns.indexOf(name)
  const warnings: string[] = []

  const required = ['Name', 'Published', 'Short description', 'Regular price', 'Images']
  for (const name of required) {
    if (column(name) === -1) warnings.push(`Export is missing the "${name}" column`)
  }

  const at = (row: string[], name: string): string => {
    const index = column(name)
    return index === -1 ? '' : (row[index] ?? '')
  }

  const rows: WooRow[] = dataRows
    .filter((row) => row.length > 1 && (at(row, 'Name') ?? '').trim().length > 0)
    .map((row) => {
      const attributes: WooAttribute[] = []
      for (let index = 1; index <= 4; index += 1) {
        const name = at(row, `Attribute ${index} name`).trim()
        const values = at(row, `Attribute ${index} value(s)`)
          .split('|')
          .map((value) => value.trim())
          .filter(Boolean)
        if (name && values.length > 0) attributes.push({ name, values })
      }

      const regularPricePKR = parsePrice(at(row, 'Regular price'))
      const salePricePKR = parsePrice(at(row, 'Sale price'))
      const sku = at(row, 'SKU').trim()

      return {
        id: at(row, 'ID').trim(),
        type: at(row, 'Type').trim() || 'simple',
        sku: sku || undefined,
        name: at(row, 'Name').trim(),
        published: flag(at(row, 'Published')),
        featured: flag(at(row, 'Is featured?')),
        inStock: flag(at(row, 'In stock?')),
        shortDescriptionHtml: unescapeNewlines(at(row, 'Short description')),
        descriptionHtml: unescapeNewlines(at(row, 'Description')),
        regularPricePKR,
        salePricePKR,
        categories: at(row, 'Categories')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        tags: at(row, 'Tags')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        imageUrls: at(row, 'Images')
          .split(',')
          .map((value) => value.trim())
          .filter((value) => value.startsWith('http')),
        attributes,
      }
    })

  if (rows.length === 0) warnings.push('Export produced no product rows')

  for (const row of rows) {
    if (!row.published) warnings.push(`Unpublished product in export: ${row.name}`)
    if (!row.sku) warnings.push(`Missing SKU: ${row.name}`)
    if (row.salePricePKR !== undefined && row.regularPricePKR === undefined) {
      warnings.push(`Sale price without a regular price: ${row.name}`)
    }
    if (row.regularPricePKR === undefined && row.salePricePKR === undefined) {
      warnings.push(`No price in source (displayed as "Ask for Price"): ${row.name}`)
    }
    if (row.salePricePKR !== undefined && row.regularPricePKR !== undefined && row.salePricePKR >= row.regularPricePKR) {
      warnings.push(`Sale price is not below the regular price: ${row.name}`)
    }
    if (row.regularPricePKR !== undefined && row.regularPricePKR < 100) {
      warnings.push(
        `Suspiciously low source price (PKR ${row.regularPricePKR}) left untouched pending client confirmation: ${row.name}`,
      )
    }
  }

  return { rows, warnings }
}
