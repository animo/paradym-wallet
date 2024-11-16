/**
 * Mostly used for mdoc crednetials
 */
export function detectImageMimeType(data: Uint8Array): 'image/jpeg' | 'image/jp2' | null {
  // Check if array is too short to contain magic numbers
  if (data.length < 12) {
    return null
  }

  // JPEG starts with FF D8 FF
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'image/jpeg'
  }

  // JPEG2000 has two possible signatures:
  // 1) 00 00 00 0C 6A 50 20 20 0D 0A 87 0A
  // 2) FF 4F FF 51

  // Check first signature
  if (
    data[0] === 0x00 &&
    data[1] === 0x00 &&
    data[2] === 0x00 &&
    data[3] === 0x0c &&
    data[4] === 0x6a && // 'j'
    data[5] === 0x50 && // 'P'
    data[6] === 0x20 &&
    data[7] === 0x20 &&
    data[8] === 0x0d &&
    data[9] === 0x0a &&
    data[10] === 0x87 &&
    data[11] === 0x0a
  ) {
    return 'image/jp2'
  }

  // Check second signature
  if (data[0] === 0xff && data[1] === 0x4f && data[2] === 0xff && data[3] === 0x51) {
    return 'image/jp2'
  }

  return null
}
