/**
 * Reads the display dimensions of an MP4's video track.
 *
 * The product films are portrait reels (720x1280), so the player has to know the
 * real aspect ratio up front. A `<video preload="none">` has no intrinsic size
 * until the browser fetches metadata, and with none it falls back to the 300x150
 * default box — which collapses a portrait film into a letterbox strip. Carrying
 * the dimensions in the data lets the player reserve the correct space, so the
 * film renders at its true shape and the page never shifts as it loads.
 *
 * Only the `tkhd` (track header) box is read. It stores the *display* size as
 * 16.16 fixed point, which is what muxers write for a rotated source, and it is
 * the box that matched the actual files here. No dependency on ffprobe.
 */

import { readFileSync } from 'node:fs'

type Box = { type: string; start: number; end: number }

/** Walks the sibling boxes inside `[start, end)`. Tolerates 64-bit and open-ended sizes. */
function readBoxes(buffer: Buffer, start: number, end: number): Box[] {
  const boxes: Box[] = []
  let offset = start

  while (offset + 8 <= end) {
    let size = buffer.readUInt32BE(offset)
    const type = buffer.toString('latin1', offset + 4, offset + 8)
    let headerSize = 8

    if (size === 1) {
      if (offset + 16 > end) break
      size = Number(buffer.readBigUInt64BE(offset + 8))
      headerSize = 16
    } else if (size === 0) {
      size = end - offset
    }

    if (size < headerSize || offset + size > end) break
    boxes.push({ type, start: offset + headerSize, end: offset + size })
    offset += size
  }

  return boxes
}

/**
 * Returns the video track's display size, or `undefined` for anything that is not
 * a readable MP4 (the caller then simply omits the aspect ratio).
 */
export function readMp4Dimensions(filePath: string): { width: number; height: number } | undefined {
  let buffer: Buffer
  try {
    buffer = readFileSync(filePath)
  } catch {
    return undefined
  }

  const moov = readBoxes(buffer, 0, buffer.length).find((box) => box.type === 'moov')
  if (!moov) return undefined

  // A file holds one `trak` per stream; the audio track's `tkhd` carries a zero
  // size, so the first track with real dimensions is the video.
  for (const trak of readBoxes(buffer, moov.start, moov.end)) {
    if (trak.type !== 'trak') continue
    const tkhd = readBoxes(buffer, trak.start, trak.end).find((box) => box.type === 'tkhd')
    if (!tkhd) continue

    const version = buffer[tkhd.start]
    // version + flags (4), then creation/modification/track-id/reserved/duration.
    const base = tkhd.start + 4 + (version === 1 ? 32 : 20)
    // reserved(8) + layer(2) + alternate group(2) + volume(2) + reserved(2), then a
    // 36-byte transform matrix, then the 16.16 width and height.
    const width = buffer.readUInt32BE(base + 16 + 36) / 65536
    const height = buffer.readUInt32BE(base + 16 + 40) / 65536

    if (width > 0 && height > 0) return { width, height }
  }

  return undefined
}
