import { SdJwtVcRecord, TypedArrayEncoder } from '@credo-ts/core'
import { Skia } from '@shopify/react-native-skia'
import { fetch } from 'expo/fetch'
import { findDisplay } from '../display/common'
import { getStoredSvgTemplateForDisplay, type SvgTemplate, selectSvgTemplate } from '../display/svgTemplate'
import { getSdJwtVcSvgTemplateMetadata, setSdJwtVcSvgTemplateMetadata } from '../metadata/credentials'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { parsePasoDataUrl } from '../paso/image'
import { verifySriIntegrity } from '../paso/sri'
import { type CredentialRecord, updateCredential } from '../storage/credentials'

const maxSvgTemplateBytes = 512 * 1024
const fetchTimeoutMs = 10_000

// The size of the credential card, at which a template is drawn once to check it.
const cardWidth = 360
const cardHeight = 227

async function fetchSvgTemplateBytes(uri: string): Promise<Uint8Array> {
  if (uri.startsWith('data:')) {
    const dataUrl = parsePasoDataUrl(uri)
    if (!dataUrl) throw new Error('the data url is malformed')

    return dataUrl.isBase64
      ? TypedArrayEncoder.fromBase64(dataUrl.payload)
      : TypedArrayEncoder.fromUtf8String(decodeURIComponent(dataUrl.payload))
  }

  if (!uri.startsWith('https://')) throw new Error('the uri does not use the https scheme')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs)

  try {
    const response = await fetch(uri, {
      headers: { Accept: 'image/svg+xml' },
      credentials: 'omit',
      signal: controller.signal,
    })

    // React Native's fetch follows redirects itself, so only where it ended up can be checked.
    if (response.url && !response.url.startsWith('https://')) throw new Error('the uri redirects to a non-https url')
    if (!response.ok) throw new Error(`the uri returned status ${response.status}`)

    const contentLength = Number(response.headers.get('content-length'))
    if (contentLength > maxSvgTemplateBytes) throw new Error(`the template is larger than ${maxSvgTemplateBytes} bytes`)

    // Read in chunks, so a response without a content-length can't make us buffer more than the limit.
    const reader = response.body?.getReader()
    if (!reader) throw new Error('the response has no body')

    const bytes = new Uint8Array(maxSvgTemplateBytes)
    let length = 0
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      if (length + chunk.value.length > maxSvgTemplateBytes) {
        await reader.cancel()
        throw new Error(`the template is larger than ${maxSvgTemplateBytes} bytes`)
      }
      bytes.set(chunk.value, length)
      length += chunk.value.length
    }

    return bytes.slice(0, length)
  } finally {
    clearTimeout(timeout)
  }
}

async function resolveSvgTemplate(template: SvgTemplate): Promise<string> {
  const bytes = await fetchSvgTemplateBytes(template.uri)
  // A data uri is already in memory, but the limit applies to it too.
  if (bytes.length > maxSvgTemplateBytes) throw new Error(`the template is larger than ${maxSvgTemplateBytes} bytes`)

  const integrity = template['uri#integrity']
  if (integrity && !verifySriIntegrity(bytes, integrity)) throw new Error('the integrity value does not match')

  const svg = TypedArrayEncoder.toUtf8String(bytes)
  // Entity declarations are how an XML file expands to gigabytes when parsed. Cards don't need them.
  if (svg.includes('<!ENTITY')) throw new Error('the template declares XML entities')

  // Drawn once now, so a template that crashes or hangs Skia does so during issuance, before the
  // credential is stored, instead of every time the card is shown. Filling in the claim values
  // later only adds escaped text, so it can't change what Skia has to draw.
  const skSvg = Skia.SVG.MakeFromString(svg, Skia.FontMgr.System())
  const surface = Skia.Surface.Make(cardWidth, cardHeight)
  if (!skSvg || !surface) throw new Error('the template is not a valid svg')
  surface.getCanvas().drawSvg(skSvg, cardWidth, cardHeight)

  return svg
}

/**
 * Fetches the SVG template the card shows in the current locale and adds it to the record's metadata.
 *
 * Only the template of the display entry the card uses (see `findDisplay`), so a type with a
 * template per locale costs one fetch. Fetched at issuance and after a language switch, never when
 * a card is shown, so the template host can't tell when the credential is used ([SD-JWT VC]
 * Section 8.4). A template that can't be fetched or fails a check is left out, and the card falls
 * back to the simple rendering. Returns whether a template was added.
 */
export async function addSdJwtVcSvgTemplateToRecord(paradym: ParadymWalletSdk, record: CredentialRecord) {
  if (!(record instanceof SdJwtVcRecord)) return false

  const displays = record.typeMetadata?.display ?? []
  const template = selectSvgTemplate(findDisplay(displays)?.rendering?.svg_templates)
  if (!template) return false

  // Every locale that selects the same template, so it is fetched and stored once for all of them.
  const locales = displays
    .filter((display) => selectSvgTemplate(display.rendering?.svg_templates)?.uri === template.uri)
    .flatMap((display) => (display.locale ? [display.locale] : []))

  try {
    setSdJwtVcSvgTemplateMetadata(record, { uri: template.uri, svg: await resolveSvgTemplate(template), locales })
    return true
  } catch (error) {
    paradym.logger.warn('Not using the svg template of a credential', {
      uri: template.uri.slice(0, 100),
      error: error instanceof Error ? error.message : error,
    })
    return false
  }
}

/**
 * Fetches the SVG template of every SD-JWT VC whose stored one isn't the template its card shows in
 * the current locale, as after a language switch. Run on the wallet's own schedule, not when a card
 * is shown or used.
 */
export async function updateSdJwtVcSvgTemplates(paradym: ParadymWalletSdk, credentialRecords: CredentialRecord[]) {
  for (const record of credentialRecords) {
    if (!(record instanceof SdJwtVcRecord)) continue

    const display = findDisplay(record.typeMetadata?.display)
    const needsTemplate = selectSvgTemplate(display?.rendering?.svg_templates) !== undefined
    if (!needsTemplate || getStoredSvgTemplateForDisplay(display, getSdJwtVcSvgTemplateMetadata(record))) continue

    if (await addSdJwtVcSvgTemplateToRecord(paradym, record))
      await updateCredential({ paradym, credentialRecord: record })
  }
}
