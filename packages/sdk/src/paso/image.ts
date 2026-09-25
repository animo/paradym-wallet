import { TypedArrayEncoder } from '@credo-ts/core'
import { verifySriIntegrity } from './sri'

/**
 * The `image` value type, per [PaSO View] Section 3.
 *
 * Section 3 puts hard limits on an image and makes every one of them fatal: an image that breaks
 * any of them "makes the `transaction_data` entry not compatible". That matters more than it looks,
 * because the bytes arrive from the Relying Party and are rendered on the consent screen — the
 * channel [PaSO View] Section 5.1 is about. So the limits are enforced here rather than left to the
 * image component, which would happily decode a 40 MB PNG and take the screen with it.
 *
 * SVG is deliberately **not** accepted, even though Section 3 lists it among the Data URL formats a
 * Wallet must support. URLs inside an SVG need the fragment-carried integrity values of
 * [PaSO Proof SD-JWT-VC and SVG] Section 3, which this wallet does not implement — and the same
 * section says a resource that cannot be verified "SHALL be considered invalid". Refusing the SVG is
 * the fail-closed reading; accepting it unverified is the one the spec rules out.
 */

/** Sent as the `Accept` header, and the allow-list the response is checked against. */
export const pasoSupportedImageMediaTypes = ['image/png', 'image/jpeg'] as const

export const pasoImageAcceptHeader = pasoSupportedImageMediaTypes.join(', ')

/** [PaSO View] Section 3 — "MUST NOT exceed 512 KiB in encoded size". */
const maxEncodedImageBytes = 512 * 1024

/** [PaSO View] Section 3 — "decoded dimensions MUST NOT exceed 2048 pixels in either direction". */
const maxImageDimension = 2048

/** Section 3 requires a fetch timeout and at most 3 redirects; it fixes neither number. */
const fetchTimeoutMs = 10_000
const maxRedirects = 3

export type PasoImageResult = { dataUrl: string } | { error: string }

function isSupportedMediaType(mediaType: string): boolean {
  return (pasoSupportedImageMediaTypes as readonly string[]).includes(mediaType)
}

/**
 * The media type and payload size of a `data:` URL, without decoding it.
 *
 * Returns `undefined` for anything that is not a well-formed Data URL per [RFC2397].
 */
export function parsePasoDataUrl(value: string): { mediaType: string; payload: string; isBase64: boolean } | undefined {
  if (!value.startsWith('data:')) return undefined

  const commaIndex = value.indexOf(',')
  if (commaIndex === -1) return undefined

  const [mediaType, ...parameters] = value.slice('data:'.length, commaIndex).split(';')

  return {
    mediaType: mediaType.trim().toLowerCase(),
    payload: value.slice(commaIndex + 1),
    isBase64: parameters.some((parameter) => parameter.trim().toLowerCase() === 'base64'),
  }
}

/**
 * The decoded pixel dimensions of a PNG or JPEG, read from its header.
 *
 * Reading the header rather than decoding the image keeps the 2048-pixel check cheap and, more to
 * the point, keeps it *before* anything hands the bytes to a decoder. `undefined` means the header
 * could not be read, which the caller treats as non-conforming rather than as "no limit applies".
 */
export function readImageDimensions(bytes: Uint8Array): { width: number; height: number } | undefined {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length > 24 && pngSignature.every((byte, index) => bytes[index] === byte)) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    // Bytes 12-16 are the chunk type, which must be IHDR for the dimensions to be where we look.
    if (String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]) !== 'IHDR') return undefined
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }

  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    let offset = 2

    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return undefined
      const marker = bytes[offset + 1]

      // Every Start Of Frame marker carries the dimensions; the three exclusions are other tables
      // that happen to fall inside the same numeric range.
      const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isStartOfFrame) return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) }

      offset += 2 + view.getUint16(offset + 2)
    }
  }

  return undefined
}

/** The reason `bytes` do not conform to [PaSO View] Section 3, or `undefined` when they do. */
function findImageConformanceIssue(bytes: Uint8Array, mediaType: string, encodedSize: number): string | undefined {
  if (!isSupportedMediaType(mediaType)) return `media type '${mediaType}' is not supported`
  if (encodedSize > maxEncodedImageBytes) return `encoded size ${encodedSize} exceeds the 512 KiB limit`

  const dimensions = readImageDimensions(bytes)
  if (!dimensions) return 'the image dimensions could not be read from its header'
  if (dimensions.width > maxImageDimension || dimensions.height > maxImageDimension) {
    return `dimensions ${dimensions.width}x${dimensions.height} exceed the 2048 pixel limit`
  }

  return undefined
}

/**
 * Validates a `data:` image URL and returns it unchanged.
 *
 * A Data URL carries its own bytes, so there is nothing to resolve and no `#integrity` sibling is
 * required — but the Section 3 limits still apply to "the Data URL payload".
 */
export function validatePasoDataUrlImage(value: string): PasoImageResult {
  const parsed = parsePasoDataUrl(value)
  if (!parsed) return { error: 'the image is not a well-formed Data URL' }

  // Section 3 asks for the "PNG, JPEG, and SVG base64 formats", so a percent-encoded payload is not
  // one of the forms an image may arrive in.
  if (!parsed.isBase64) return { error: 'the image Data URL is not base64 encoded' }

  let bytes: Uint8Array
  try {
    // `@scure/base` requires the padding that a Data URL payload is allowed to omit.
    bytes = TypedArrayEncoder.fromBase64(parsed.payload.padEnd(Math.ceil(parsed.payload.length / 4) * 4, '='))
  } catch {
    return { error: 'the Data URL payload is not valid base64' }
  }

  const issue = findImageConformanceIssue(bytes, parsed.mediaType, parsed.payload.length)
  return issue ? { error: issue } : { dataUrl: value }
}

/**
 * Fetches an image URL, verifies it against its [W3C.SRI] integrity value, and inlines it.
 *
 * The bytes are returned as a `data:` URL rather than the original URL being handed to the image
 * component on purpose: a second fetch could return different bytes than the ones we verified, and
 * the whole point of the `#integrity` sibling claim is that the user sees the image the Relying
 * Party committed to.
 *
 * Redirects are followed by hand because Section 3 caps them at three and the platform `fetch`
 * offers no way to observe its own redirect count.
 */
export async function resolvePasoImageUrl(url: string, integrity: string): Promise<PasoImageResult> {
  // Section 3: "If the URL is not a Data URL, it MUST use the `https` scheme".
  if (!url.startsWith('https://')) return { error: 'the image URL does not use the https scheme' }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs)

  try {
    let currentUrl = url
    let response: Response | undefined

    for (let redirects = 0; redirects <= maxRedirects; redirects++) {
      response = await fetch(currentUrl, {
        headers: { Accept: pasoImageAcceptHeader },
        // Section 3: "SHALL NOT transmit cookies, credentials, or Wallet-identifying headers".
        credentials: 'omit',
        redirect: 'manual',
        signal: controller.signal,
      })

      // A 3xx with a `Location` is the only case we follow; anything else is the final response.
      const location = response.status >= 300 && response.status < 400 ? response.headers.get('location') : null
      if (!location) break

      const target = new URL(location, currentUrl)
      if (target.protocol !== 'https:') return { error: 'the image URL redirects away from https' }
      currentUrl = target.toString()
      response = undefined
    }

    if (!response) return { error: `the image URL redirects more than ${maxRedirects} times` }
    if (!response.ok) return { error: `the image URL returned status ${response.status}` }

    // Checked before reading the body so an oversized response is refused rather than buffered.
    const contentLength = Number(response.headers.get('content-length'))
    if (Number.isFinite(contentLength) && contentLength > maxEncodedImageBytes) {
      return { error: `encoded size ${contentLength} exceeds the 512 KiB limit` }
    }

    const bytes = new Uint8Array(await response.arrayBuffer())
    if (!verifySriIntegrity(bytes, integrity)) return { error: 'the integrity value does not match the image' }

    const [mediaType] = (response.headers.get('content-type') ?? '').split(';')
    const issue = findImageConformanceIssue(bytes, mediaType.trim().toLowerCase(), bytes.length)
    if (issue) return { error: issue }

    return { dataUrl: `data:${mediaType.trim().toLowerCase()};base64,${TypedArrayEncoder.toBase64(bytes)}` }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'the image could not be retrieved' }
  } finally {
    clearTimeout(timeout)
  }
}
