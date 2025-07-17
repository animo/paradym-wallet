import {
  ClaimFormat,
  MdocRecord,
  SdJwtVcRecord,
  type VerifiableCredential,
  W3cCredentialRecord,
  W3cJsonLdVerifiableCredential,
  W3cJwtVerifiableCredential,
  type W3cVerifiableCredential,
} from '@credo-ts/core'

export function decodeW3cCredential(credential: Record<string, unknown> | string): W3cVerifiableCredential {
  return typeof credential === 'string'
    ? W3cJwtVerifiableCredential.fromSerializedJwt(credential)
    : W3cJsonLdVerifiableCredential.fromJson(credential)
}

export function encodeCredential(credential: VerifiableCredential): Record<string, unknown> | string {
  return credential.encoded
}

export function credentialRecordFromCredential(credential: VerifiableCredential) {
  if (credential.claimFormat === ClaimFormat.SdJwtVc) {
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

  return new W3cCredentialRecord({
    credential,
    // We don't support expanded types right now, but would become problem when we support JSON-LD
    tags: {},
  })
}
