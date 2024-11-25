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
  const credentialResult = credentialWithClaimFormat(credential)

  if (credentialResult.claimFormat === ClaimFormat.SdJwtVc) {
    return credentialResult.credential.compact
  }

  if (credentialResult.claimFormat === ClaimFormat.MsoMdoc) {
    return credentialResult.credential.base64Url
  }

  return credentialResult.credential.encoded
}

export function credentialRecordFromCredential(credential: VerifiableCredential) {
  const credentialResult = credentialWithClaimFormat(credential)

  if (credentialResult.claimFormat === ClaimFormat.SdJwtVc) {
    // NOTE: temp override to use sd-jwt type metadata even if vct is old url
    const typeMetadata =
      credentialResult.credential.payload.vct === 'https://example.bmi.bund.de/credential/pid/1.0'
        ? pidBdrSdJwtTypeMetadata
        : credentialResult.credential.typeMetadata

    return new SdJwtVcRecord({
      compactSdJwtVc: credentialResult.credential.compact,
      typeMetadata,
    })
  }

  if (credentialResult.claimFormat === ClaimFormat.MsoMdoc) {
    return new MdocRecord({
      mdoc: credentialResult.credential,
    })
  }

  return new W3cCredentialRecord({
    credential: credentialResult.credential,
    // We don't support expanded types right now, but would become problem when we support JSON-LD
    tags: {},
  })
}

export function credentialWithClaimFormat(credential: VerifiableCredential) {
  // TODO: Add claim format in credo
  if ('compact' in credential) {
    return {
      claimFormat: ClaimFormat.SdJwtVc,
      credential,
    } as const
  }

  if (credential instanceof Mdoc) {
    return {
      claimFormat: ClaimFormat.MsoMdoc,
      credential,
    } as const
  }

  return {
    credential,
    claimFormat: credential.claimFormat,
  } as const
}
