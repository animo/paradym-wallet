import type {
  SdJwtVcTypeMetadata,
  SdJwtVcTypeMetadataDisplay,
  SdJwtVcTypeMetadataRenderingMethodSvgTemplate,
} from '@credo-ts/core'
import type { SdJwtVcSvgTemplateMetadata } from '../metadata/credentials'

/**
 * The `svg_templates` rendering method of SD-JWT VC type metadata ([SD-JWT VC] Section 5.5.1.2).
 *
 * The template comes from the type metadata publisher and the values from the issuer, and neither
 * is trusted with more than drawing the card. This module only fills in the values. Keeping the
 * template inert is up to the renderer: it must run no scripts and load no external resources
 * (Section 7.10), which is why the wallet draws it with Skia rather than a WebView.
 */

export type SvgTemplate = SdJwtVcTypeMetadataRenderingMethodSvgTemplate[number]

/**
 * The template that fits a card best. Cards are landscape and the app is light only, so portrait
 * templates are skipped and light, normal contrast ones preferred. An absent property matches any.
 */
export function selectSvgTemplate(templates?: SvgTemplate[]): SvgTemplate | undefined {
  const candidates = templates?.filter((template) => template.properties?.orientation !== 'portrait') ?? []

  return (
    candidates.find(({ properties }) => properties?.color_scheme !== 'dark' && properties?.contrast !== 'high') ??
    candidates.find(({ properties }) => properties?.color_scheme !== 'dark') ??
    candidates[0]
  )
}

/**
 * The stored template, when it is the one this display entry selects. `undefined` means the entry
 * has no template, or a different one than was fetched, as after a language switch.
 */
export function getStoredSvgTemplateForDisplay(
  display: SdJwtVcTypeMetadataDisplay | undefined,
  stored: SdJwtVcSvgTemplateMetadata | null | undefined
): string | undefined {
  const template = selectSvgTemplate(display?.rendering?.svg_templates)
  if (!template || !stored || stored.uri !== template.uri) return undefined
  if (display?.locale && !stored.locales.includes(display.locale)) return undefined

  return stored.svg
}

// Section 5.6: an `svg_id` is alphanumerics and underscores, not starting with a digit.
const placeholderPattern = /\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g

// Anything outside the XML 1.0 `Char` production, including lone surrogates.
const invalidXmlCharacterPattern = /[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function getValueAtPath(payload: Record<string, unknown>, path: Array<string | number>): unknown {
  let value: unknown = payload
  for (const segment of path) {
    const isMatchingContainer = typeof segment === 'number' ? Array.isArray(value) : isPlainObject(value)
    // Own properties only, so a path like ['constructor'] can't read from the prototype.
    value = isMatchingContainer && Object.hasOwn(value as object, segment) ? (value as never)[segment] : undefined
  }
  return value
}

function isPlainObject(value: unknown) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * The text a placeholder is replaced with, or `undefined` when the template must not be rendered.
 */
function resolvePlaceholderValue(
  svgId: string,
  claims: SdJwtVcTypeMetadata['claims'],
  payload: Record<string, unknown>
): string | undefined {
  const claim = claims?.find((claim) => claim.svg_id === svgId)
  // Section 5.5.1.2.2: a placeholder without claim metadata, or whose path can select more than one
  // value, means the template is not rendered.
  if (!claim || claim.path.some((segment) => segment === null)) return undefined

  const value = getValueAtPath(payload, claim.path as Array<string | number>)
  if (value === undefined || value === null) return ''
  // An object or array has no single text form to put in the card.
  if (typeof value === 'object') return undefined

  const text = String(value)
  if (invalidXmlCharacterPattern.test(text)) return undefined

  return escapeXml(text)
}

/**
 * Fills the `{{svg_id}}` placeholders of a template with the claim values of the credential.
 *
 * Returns `undefined` when the spec says not to render the template, so the caller can fall back to
 * the simple rendering. Replacement is a single pass, so a value that contains a placeholder is not
 * expanded again.
 */
export function fillSvgTemplate(
  template: string,
  claims: SdJwtVcTypeMetadata['claims'],
  payload: Record<string, unknown>
): string | undefined {
  let isRenderable = true

  const filled = template.replace(placeholderPattern, (_, svgId: string) => {
    const value = resolvePlaceholderValue(svgId, claims, payload)
    if (value === undefined) isRenderable = false
    return value ?? ''
  })

  return isRenderable ? filled : undefined
}
