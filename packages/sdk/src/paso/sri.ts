import { Hasher, TypedArrayEncoder } from '@credo-ts/core'

/**
 * Subresource Integrity, as PaSO uses it.
 *
 * PaSO leans on [W3C.SRI] in three places that all matter for the proof: `metadata_integrity` and
 * `request_integrity` in the holder binding proof ([PaSO Core] Section 6.1), and the `#integrity`
 * sibling claim of an `image` value ([PaSO View] Section 3).
 *
 * An integrity value is `<hash algorithm>-<standard base64 of the digest>`. Note the standard
 * base64: the rest of OpenID4VP is base64url, and mixing the two silently produces a value that
 * never matches.
 */

const sriHashAlgorithms = {
  sha256: 'sha-256',
  sha384: 'sha-384',
  sha512: 'sha-512',
} as const

type SriHashAlgorithm = keyof typeof sriHashAlgorithms

function digest(data: Uint8Array, algorithm: SriHashAlgorithm) {
  return TypedArrayEncoder.toBase64(Hasher.hash(data, sriHashAlgorithms[algorithm]))
}

function toBytes(data: Uint8Array | string) {
  return typeof data === 'string' ? TypedArrayEncoder.fromUtf8String(data) : data
}

/**
 * The [W3C.SRI] integrity value of `data`.
 *
 * Used for the two integrity claims the Wallet produces. `sha256` is the only algorithm PaSO's
 * examples use and the only one any of its checks require, so it is the default.
 */
export function computeSriIntegrity(data: Uint8Array | string, algorithm: SriHashAlgorithm = 'sha256'): string {
  return `${algorithm}-${digest(toBytes(data), algorithm)}`
}

/**
 * Whether `data` matches an integrity value.
 *
 * [W3C.SRI] allows an integrity attribute to carry several alternatives separated by whitespace and
 * treats the resource as valid if any of them matches, so that is what this does. An entry with an
 * algorithm we do not know is ignored rather than treated as a mismatch — but a value consisting
 * only of such entries fails, because nothing was actually verified.
 *
 * An entry may carry options after a `?`, which [W3C.SRI] reserves for future use and says to
 * ignore. Keeping them in the comparison would make every such value fail to match.
 */
export function verifySriIntegrity(data: Uint8Array | string, integrity: string): boolean {
  const bytes = toBytes(data)

  return integrity
    .split(/\s+/)
    .filter((entry) => entry.length > 0)
    .some((entry) => {
      const separatorIndex = entry.indexOf('-')
      if (separatorIndex === -1) return false

      const algorithm = entry.slice(0, separatorIndex)
      const [expectedDigest] = entry.slice(separatorIndex + 1).split('?')
      if (!(algorithm in sriHashAlgorithms)) return false

      return digest(bytes, algorithm as SriHashAlgorithm) === expectedDigest
    })
}
