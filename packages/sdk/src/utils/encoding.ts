import {
  ClaimFormat,
  MdocRecord,
  SdJwtVcRecord,
  type VerifiableCredential,
  W3cCredentialRecord,
  W3cJsonLdVerifiableCredential,
  W3cJwtVerifiableCredential,
  W3cV2CredentialRecord,
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

export function credentialRecordFromCredential(credential: VerifiableCredential) {
  if (credential.claimFormat === ClaimFormat.SdJwtDc) {
    return new SdJwtVcRecord({
      compactSdJwtVc: credential.compact,
      typeMetadata: credential.typeMetadata,
    })
  }

  if (credential.claimFormat === ClaimFormat.MsoMdoc) {
    return new MdocRecord({
      mdoc: credential,
    })
  }

  if (credential.claimFormat === ClaimFormat.SdJwtW3cVc || credential.claimFormat === ClaimFormat.JwtW3cVc) {
    return new W3cV2CredentialRecord({
      credential,
    })
  }

  return new W3cCredentialRecord({
    credential,
    // We don't support expanded types right now, but would become problem when we support JSON-LD
    tags: {},
  })
}
