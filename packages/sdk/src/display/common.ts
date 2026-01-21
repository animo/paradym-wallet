import type { AnonCredsRequestedPredicate } from '@credo-ts/anoncreds'
import { ClaimFormat } from '@credo-ts/core'
import type { FormattedSubmissionEntrySatisfiedCredential } from '../format/submission'
import { formatDate } from '../utils/date'
import type { CredentialDisplay, CredentialMetadata } from './credential'
import { sanitizeString } from './strings'

export function findDisplay<Display extends { locale?: string; lang?: string }>(
  display?: Display[]
): Display | undefined {
  if (!display) return undefined

  let item = display.find((d) => d.locale?.startsWith('en-') || d.lang?.startsWith('en-'))
  if (!item) item = display.find((d) => !d.locale && !d.lang)
  if (!item) item = display[0]

  return item
}

export function getDisclosedAttributePathArrays(
  payload: object,
  maxDepth: number | undefined = undefined,
  prefix: string[] = []
): string[][] {
  let attributePaths: string[][] = []

  for (const [key, value] of Object.entries(payload)) {
    if (!value) continue

    // TODO: handle arrays
    const newPath = [...prefix, key]
    if (value && typeof value === 'object' && maxDepth !== 0) {
      // If the value is a nested object, recurse
      attributePaths = [
        ...attributePaths,
        ...getDisclosedAttributePathArrays(value, maxDepth !== undefined ? maxDepth - 1 : undefined, newPath),
      ]
    } else {
      // If the value is a primitive or maxDepth is reached, add the key to the list
      attributePaths.push(newPath)
    }
  }

  return attributePaths
}

export function getDisclosedAttributeNamesForDisplay(credential: FormattedSubmissionEntrySatisfiedCredential) {
  // FIXME: this implementation in still too naive
  // TODO: use the credential claim metadata (sd-jwt / oid4vc) to get labels for attribute paths
  // TODO: we miss e.g. showing age_equal_or_over.21 as Age Over 21, but with the display metadata
  // from bdr we can at least show it as: Age verification. If there is a key for a nested path we can
  // also decide to include it

  // For mdoc we remove the namespaces
  if (credential.credential.claimFormat === ClaimFormat.MsoMdoc) {
    return Array.from(new Set(credential.disclosed.paths.map((path) => sanitizeString(path[1]))))
  }

  // Otherwise we take the top-level keys
  return Array.from(
    new Set(
      credential.disclosed.paths
        .filter((path): path is [string] => typeof path[0] === 'string')
        .map((path) => sanitizeString(path[0]))
    )
  )
}

export function getUnsatisfiedAttributePathsForDisplay(
  paths: Array<string | number | null | AnonCredsRequestedPredicate>[]
) {
  const nonRenderedPaths = ['iss', 'vct']
  return Array.from(
    new Set(
      paths
        .filter(
          (path): path is [string] =>
            typeof path[0] === 'string' && !path.some((p) => nonRenderedPaths.includes(p as string))
        )
        .map((path) => sanitizeString(path[0]))
    )
  )
}
export function getCredentialDisplayWithDefaults(credentialDisplay?: Partial<CredentialDisplay>): CredentialDisplay {
  return {
    ...credentialDisplay,
    name: credentialDisplay?.name ?? 'Credential',
    issuer: {
      ...credentialDisplay?.issuer,
      name: credentialDisplay?.issuer?.name ?? 'Unknown',
    },
  }
}
export function metadataForDisplay(metadata: CredentialMetadata) {
  const { type, holder, issuedAt, issuer, validFrom, validUntil } = metadata

  return {
    type,
    issuer,
    holder,
    issuedAt: issuedAt ? formatDate(new Date(issuedAt)) : undefined,
    validFrom: validFrom ? formatDate(new Date(validFrom)) : undefined,
    validUntil: validUntil ? formatDate(new Date(validUntil)) : undefined,
  }
}
