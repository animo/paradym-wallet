import {
  ClaimFormat,
  Mdoc,
  MdocRecord,
  SdJwtVcRecord,
  type VerifiableCredential,
  W3cCredentialRecord,
  W3cJsonLdVerifiableCredential,
  W3cJwtVerifiableCredential,
  type W3cVerifiableCredential,
} from '@credo-ts/core'
import { pidBdrSdJwtTypeMetadata } from './pidBdrSdJwtTypeMetadata'

export function decodeW3cCredential(credential: Record<string, unknown> | string): W3cVerifiableCredential {
  return typeof credential === 'string'
    ? W3cJwtVerifiableCredential.fromSerializedJwt(credential)
    : W3cJsonLdVerifiableCredential.fromJson(credential)
}

export function encodeCredential(credential: VerifiableCredential): Record<string, unknown> | string {
  if (credential.claimFormat === ClaimFormat.SdJwtVc) {
    return credential.compact
  }

  if (credential.claimFormat === ClaimFormat.MsoMdoc) {
    return credential.base64Url
  }

  return credential.encoded
}

export function credentialFromCredentialRecord(credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord) {
  if (credentialRecord instanceof W3cCredentialRecord) {
    return credentialRecord.credential
  }

  if (credentialRecord instanceof SdJwtVcRecord) {
    return credentialRecord.sdJwtVc
  }

  return Mdoc.fromBase64Url(credentialRecord.base64Url)
}

export function credentialRecordFromCredential(credential: VerifiableCredential) {
  if (credential.claimFormat === ClaimFormat.SdJwtVc) {
    // NOTE: temp override to use sd-jwt type metadata even if vct is old url
    const typeMetadata =
      credential.payload.vct === 'https://example.bmi.bund.de/credential/pid/1.0'
        ? pidBdrSdJwtTypeMetadata
        : credential.typeMetadata

    return new SdJwtVcRecord({
      compactSdJwtVc: credential.compact,
      typeMetadata,
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
