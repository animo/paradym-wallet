import {
  ClaimFormat,
  Mdoc,
  MdocRecord,
  SdJwtVcRecord,
  W3cCredentialRecord,
  type VerifiableCredential,
} from '@credo-ts/core'

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
    return new SdJwtVcRecord({
      compactSdJwtVc: credentialResult.credential.compact,
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
