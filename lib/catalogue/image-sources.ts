/**
 * Resolves the source photography for each product.
 *
 * Priority is fixed and honest — no stock photography is ever substituted:
 *
 *   1. the local mirror of the old WordPress uploads (`reference/`, git-ignored)
 *   2. the original source URL, fetched once at migration time
 *   3. a branded JAF placeholder, when neither exists
 *
 * The mirror keeps the WordPress path layout (`reference/<yyyy>/<mm>/<file>`),
 * and file names differ only in case on disk, so lookups go through an index.
 */

import { readdirSync, statSync } from 'node:fs'
import { join, posix } from 'node:path'

/** Where the previous audit mirrored `wp-content/uploads`. */
export const REFERENCE_ROOT = 'reference'

const IMAGE_EXTENSIONS = ['.webp', '.avif', '.jpg', '.jpeg', '.png', '.gif']

/** `https://…/wp-content/uploads/2025/01/x-300x300.webp` → `2025/01/x-300x300.webp` */
export function uploadPathFromUrl(url: string): string | undefined {
  const match = url.match(/wp-content\/uploads\/(.+)$/)
  if (!match) return undefined
  const path = decodeURIComponent((match[1] ?? '').split('?')[0] ?? '').replace(/^\/+/, '')
  return path.length > 0 ? path : undefined
}

/** Strips a WordPress-generated size suffix: `photo-300x300.webp` → `photo.webp`. */
export function baseImageName(fileName: string): string {
  return fileName.replace(/-(\d{2,4})x(\d{2,4})(?=\.[a-z0-9]+$)/i, '')
}

export type ReferenceIndex = {
  /** Case-insensitive exact lookup inside the mirror. */
  find: (relativePath: string) => string | undefined
  /** Lookup that also tries the un-resized file and alternative encodings. */
  resolve: (relativePath: string) => string | undefined
  size: number
}

/** Builds a case-insensitive index of every file in the mirror (one pass). */
export function createReferenceIndex(root: string = REFERENCE_ROOT): ReferenceIndex {
  const byLowerPath = new Map<string, string>()
  const byLowerDirectory = new Map<string, Map<string, string>>()

  const walk = (absolute: string, relative: string): void => {
    let entries: string[]
    try {
      entries = readdirSync(absolute)
    } catch {
      return
    }
    for (const entry of entries) {
      const childAbsolute = join(absolute, entry)
      const childRelative = relative ? posix.join(relative, entry) : entry
      let isDirectory = false
      try {
        isDirectory = statSync(childAbsolute).isDirectory()
      } catch {
        continue
      }
      if (isDirectory) {
        walk(childAbsolute, childRelative)
        continue
      }
      byLowerPath.set(childRelative.toLowerCase(), childRelative)
      const directory = posix.dirname(childRelative)
      const bucket = byLowerDirectory.get(directory) ?? new Map<string, string>()
      bucket.set(posix.basename(childRelative).toLowerCase(), childRelative)
      byLowerDirectory.set(directory, bucket)
    }
  }

  walk(root, '')

  const find = (relativePath: string): string | undefined => byLowerPath.get(relativePath.toLowerCase())

  const resolve = (relativePath: string): string | undefined => {
    const direct = find(relativePath)
    if (direct) return direct

    const directory = posix.dirname(relativePath)
    const fileName = posix.basename(relativePath)
    const bucket = byLowerDirectory.get(directory)
    if (!bucket) return undefined

    const candidates: string[] = []
    const withoutConverted = fileName.replace(/_converted(?=\.[a-z0-9]+$)/i, '')
    const base = baseImageName(fileName)
    const baseWithoutConverted = baseImageName(withoutConverted)
    const stem = fileName.replace(/\.[a-z0-9]+$/i, '')
    const baseStem = base.replace(/\.[a-z0-9]+$/i, '')
    const extension = (fileName.match(/\.[a-z0-9]+$/i)?.[0] ?? '').toLowerCase()

    for (const name of [fileName, withoutConverted, base, baseWithoutConverted]) {
      if (bucket.has(name.toLowerCase())) return bucket.get(name.toLowerCase())
    }

    // Same stem, different encoding (the site converted uploads to avif/webp over time).
    for (const candidateStem of [stem, baseStem, stem.replace(/_converted$/i, ''), baseStem.replace(/_converted$/i, '')]) {
      for (const candidateExtension of IMAGE_EXTENSIONS) {
        if (candidateExtension === extension) continue
        candidates.push(`${candidateStem}${candidateExtension}`)
      }
    }
    // The un-resized upload may be the only one mirrored.
    for (const candidateExtension of IMAGE_EXTENSIONS) candidates.push(`${baseStem}${candidateExtension}`)

    for (const candidate of candidates) {
      const hit = bucket.get(candidate.toLowerCase())
      if (hit) return hit
    }
    return undefined
  }

  return { find, resolve, size: byLowerPath.size }
}
