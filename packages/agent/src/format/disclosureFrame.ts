import { Hasher } from '@credo-ts/core'
import { decodeSdJwtVc } from '@credo-ts/core/build/modules/sd-jwt-vc/decodeSdJwtVc'
import { decodeSdJwtSync } from '@sd-jwt/decode'
import { selectDisclosures } from '@sd-jwt/present'

// TODO: remove once available in Credo
export function applyLimitdisclosureForSdJwtRequestedPayload(
  compactSdJwtVc: string,
  requestedPayload: Record<string, unknown>
) {
  const decoded = decodeSdJwtSync(compactSdJwtVc, Hasher.hash)
  const presentationFrame = buildDisclosureFrameFromPayload(requestedPayload)

  const requiredDisclosures = selectDisclosures(
    decoded.jwt.payload,
    // Map to sd-jwt disclosure format
    decoded.disclosures.map((d) => ({
      digest: d.digestSync({ alg: 'sha-256', hasher: Hasher.hash }),
      encoded: d.encode(),
      key: d.key,
      salt: d.salt,
      value: d.value,
    })),
    presentationFrame as {
      [x: string]: boolean | undefined
    }
  )
  const [jwt] = compactSdJwtVc.split('~')
  const sdJwt = `${jwt}~${requiredDisclosures.map((d) => d.encoded).join('~')}~`
  const disclosedDecoded = decodeSdJwtVc(sdJwt)
  return disclosedDecoded
}

type DisclosureFrame = {
  [key: string]: boolean | DisclosureFrame
}

export function buildDisclosureFrameFromPayload(input: Record<string, unknown>): DisclosureFrame {
  // Handle objects recursively
  const result: DisclosureFrame = {}

  // Base case: input is null or undefined
  if (input === null || input === undefined) {
    return result
  }

  for (const [key, value] of Object.entries(input)) {
    // Ignore non-value values
    if (value === null || value === undefined) continue

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // TODO: Array disclosure frames are not yet supported - treating entire array as disclosed
        result[key] = true
      } else {
        result[key] = buildDisclosureFrameFromPayload(value as Record<string, unknown>)
      }
    } else {
      // Handle primitive values
      result[key] = true
    }
  }

  return result
}
