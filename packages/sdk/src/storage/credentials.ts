import {
  MdocRecord,
  MdocRepository,
  type SdJwtVcRecord,
  SdJwtVcRepository,
  W3cCredentialRecord,
  W3cCredentialRepository,
  W3cV2CredentialRecord,
  W3cV2CredentialRepository,
} from '@credo-ts/core'
import type { DcApiRegisterCredentialsOptions } from '../dcApi/registerCredentials'
import type { CredentialForDisplayId } from '../display/credential'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'

export type { W3cCredentialRecord, W3cV2CredentialRecord, SdJwtVcRecord, MdocRecord }
export type CredentialRecord = W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord

export async function getCredential(
  paradym: ParadymWalletSdk,
  credentialId: CredentialForDisplayId
): Promise<CredentialRecord> {
  if (credentialId.startsWith('w3c-credential-')) {
    const w3cCredentialId = credentialId.replace('w3c-credential-', '')
    return paradym.agent.w3cCredentials.getById(w3cCredentialId)
  }

  if (credentialId.startsWith('w3c-v2-credential-')) {
    const w3cV2CredentialId = credentialId.replace('w3c-v2-credential-', '')
    return paradym.agent.w3cV2Credentials.getById(w3cV2CredentialId)
  }

  if (credentialId.startsWith('sd-jwt-vc')) {
    const sdJwtVcId = credentialId.replace('sd-jwt-vc-', '')
    return paradym.agent.sdJwtVc.getById(sdJwtVcId)
  }

  if (credentialId.startsWith('mdoc-')) {
    const mdocId = credentialId.replace('mdoc-', '')
    return paradym.agent.mdoc.getById(mdocId)
  }

  throw new Error('Unsupported record type')
}

export async function updateCredential(
  options: DcApiRegisterCredentialsOptions & { credentialRecord: CredentialRecord }
) {
  if (options.credentialRecord instanceof W3cCredentialRecord) {
    await options.paradym.agent.dependencyManager
      .resolve(W3cCredentialRepository)
      .update(options.paradym.agent.context, options.credentialRecord)
  } else if (options.credentialRecord instanceof W3cV2CredentialRecord) {
    await options.paradym.agent.dependencyManager
      .resolve(W3cV2CredentialRepository)
      .update(options.paradym.agent.context, options.credentialRecord)
  } else if (options.credentialRecord instanceof MdocRecord) {
    await options.paradym.agent.dependencyManager
      .resolve(MdocRepository)
      .update(options.paradym.agent.context, options.credentialRecord)
  } else {
    await options.paradym.agent.dependencyManager
      .resolve(SdJwtVcRepository)
      .update(options.paradym.agent.context, options.credentialRecord)
  }

  // Update database when we update a credential
  await options.paradym.dcApi.registerCredentials(options)
}

export async function storeCredential(
  options: DcApiRegisterCredentialsOptions & { credentialRecord: CredentialRecord }
) {
  if (options.credentialRecord instanceof W3cCredentialRecord) {
    await options.paradym.agent.dependencyManager
      .resolve(W3cCredentialRepository)
      .save(options.paradym.agent.context, options.credentialRecord)
  } else if (options.credentialRecord instanceof W3cV2CredentialRecord) {
    await options.paradym.agent.dependencyManager
      .resolve(W3cV2CredentialRepository)
      .save(options.paradym.agent.context, options.credentialRecord)
  } else if (options.credentialRecord instanceof MdocRecord) {
    await options.paradym.agent.dependencyManager
      .resolve(MdocRepository)
      .save(options.paradym.agent.context, options.credentialRecord)
  } else {
    await options.paradym.agent.dependencyManager
      .resolve(SdJwtVcRepository)
      .save(options.paradym.agent.context, options.credentialRecord)
  }

  // Update database when we store a credential
  await options.paradym.dcApi.registerCredentials(options)
}

export async function deleteCredential(
  options: DcApiRegisterCredentialsOptions & { credentialId: CredentialForDisplayId }
) {
  if (options.credentialId.startsWith('w3c-credential-')) {
    const w3cCredentialId = options.credentialId.replace('w3c-credential-', '')
    await options.paradym.agent.w3cCredentials.deleteById(w3cCredentialId)
  } else if (options.credentialId.startsWith('w3c-v2-credential-')) {
    const w3cV2CredentialId = options.credentialId.replace('w3c-v2-credential-', '')
    await options.paradym.agent.w3cV2Credentials.deleteById(w3cV2CredentialId)
  } else if (options.credentialId.startsWith('sd-jwt-vc')) {
    const sdJwtVcId = options.credentialId.replace('sd-jwt-vc-', '')
    await options.paradym.agent.sdJwtVc.deleteById(sdJwtVcId)
  } else if (options.credentialId.startsWith('mdoc-')) {
    const mdocId = options.credentialId.replace('mdoc-', '')
    await options.paradym.agent.mdoc.deleteById(mdocId)
  }

  // Update database when we delete a credential
  await options.paradym.dcApi.registerCredentials(options)
}
