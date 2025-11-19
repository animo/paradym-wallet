import {
  type VerifiableCredential,
  W3cJsonLdVerifiableCredential,
  W3cJwtVerifiableCredential,
  W3cV2JwtVerifiableCredential,
  W3cV2SdJwtVerifiableCredential,
  type W3cV2VerifiableCredential,
  type W3cVerifiableCredential,
} from '@credo-ts/core'

export function decodeW3cCredential(credential: Record<string, unknown> | string): W3cVerifiableCredential {
  return typeof credential === 'string'
    ? W3cJwtVerifiableCredential.fromSerializedJwt(credential)
    : W3cJsonLdVerifiableCredential.fromJson(credential)
}

export function decodeW3cV2Credential(credential: string): W3cV2VerifiableCredential {
  return credential.includes('~')
    ? W3cV2SdJwtVerifiableCredential.fromCompact(credential)
    : W3cV2JwtVerifiableCredential.fromCompact(credential)
}

export function encodeCredential(credential: VerifiableCredential): Record<string, unknown> | string {
  return credential.encoded
}
