import { Hasher, type JwkJson, TypedArrayEncoder } from '@credo-ts/core'

export function safeCalculateJwkThumbprint(jwk: JwkJson): string | undefined {
  try {
    const thumbprint = TypedArrayEncoder.toBase64URL(
      Hasher.hash(
        JSON.stringify({ k: jwk.k, e: jwk.e, crv: jwk.crv, kty: jwk.kty, n: jwk.n, x: jwk.x, y: jwk.y }),
        'sha-256'
      )
    )
    return `urn:ietf:params:oauth:jwk-thumbprint:sha-256:${thumbprint}`
  } catch (e) {
    return undefined
  }
}
