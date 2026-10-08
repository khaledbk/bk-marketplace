import { describe, expect, test, tier } from 'claude-code/testing'

import { drawableOf } from '../hooks/drawable-of'
import { PNGS, TINY_PNG } from './fixtures'

tier('user')

// Under every fixture PNG's own size and over its 8 bytes of pixels, so each
// is decoded and none shrunk.
const OVER_PNG_UNDER_PIXELS = 16

const pixelsOf = (base64: string) => {
  const drawable = drawableOf({ id: 'p', base64, mediaType: 'image/png', name: 'p.png' }, OVER_PNG_UNDER_PIXELS)

  if (!('source' in drawable) || !('rgba' in drawable.source)) {
    throw new Error(`not drawn as pixels: ${JSON.stringify(drawable)}`)
  }

  return [...Uint8Array.fromBase64(drawable.source.rgba)]
}

describe('drawable-of', () => {
  test('a PNG within its share is drawn as it is, sized by its header', () => {
    expect(drawableOf({ id: 'a', base64: TINY_PNG, mediaType: 'image/png', name: 'a.png' }, 4096)).toEqual({
      source: { png: TINY_PNG },
      width: 16,
      height: 12,
    })
  })

  test('a PNG over its share is decoded, each colour type to RGBA', () => {
    expect(pixelsOf(PNGS.RGB)).toEqual([255, 0, 0, 255, 0, 255, 0, 255])
    expect(pixelsOf(PNGS.RGBA)).toEqual([255, 0, 0, 128, 0, 0, 255, 0])
    expect(pixelsOf(PNGS.GRAY)).toEqual([0, 0, 0, 255, 200, 200, 200, 255])
    expect(pixelsOf(PNGS.GRAY_ALPHA)).toEqual([50, 50, 50, 100, 250, 250, 250, 255])
    expect(pixelsOf(PNGS.RGB16)).toEqual([0xff, 0x80, 0x01, 255, 0, 0, 0xff, 255])
    expect(pixelsOf(PNGS.PALETTE)).toEqual([40, 50, 60, 7, 10, 20, 30, 255])
  })

  test('a 1-bit grayscale PNG over its share says why it is not drawn', () => {
    expect(drawableOf({ id: 'g', base64: PNGS.GRAY1, mediaType: 'image/png', name: 'g.png' }, 1)).toEqual({
      reason: 'it did not decode: 1-bit grayscale PNGs are not unpacked here',
    })
  })

  test('bytes that are not a PNG say so', () => {
    expect(drawableOf({ id: 'x', base64: 'AAAA', mediaType: 'image/png', name: 'x.png' }, 4096)).toEqual({
      reason: 'the file is not a PNG',
    })
  })

  test('a header past 16 MP is refused before anything is decoded', () => {
    const png = new Uint8Array(64)
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
    new DataView(png.buffer).setUint32(16, 20_000)
    new DataView(png.buffer).setUint32(20, 20_000)
    const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0xff, 0xff, 0xff, 0xff, 0, 0, 0, 0x3b])

    for (const [bytes, mediaType] of [[png, 'image/png'], [gif, 'image/gif']] as const) {
      for (const maxBytes of [16, 4096]) {
        const drawable = drawableOf({ id: 'x', base64: bytes.toBase64(), mediaType, name: 'x' }, maxBytes)
        expect('reason' in drawable && drawable.reason.includes('MP')).toBe(true)
      }
    }
  })

  test('an encoded picture past 20 MiB is refused unread', () => {
    const drawable = drawableOf({ id: 'x', base64: 'A'.repeat(28 * 1024 * 1024), mediaType: 'image/png', name: 'x.png' }, 4096)
    expect('reason' in drawable && drawable.reason.includes('MiB')).toBe(true)
  })
})
