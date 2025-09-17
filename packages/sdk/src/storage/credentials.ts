import {
  MdocRecord,
  MdocRepository,
  type SdJwtVcRecord,
  SdJwtVcRepository,
  W3cCredentialRecord,
  W3cCredentialRepository,
} from '@credo-ts/core'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import type { BaseAgent } from '../agent'
import type { CredentialForDisplayId } from '../display/credential'
import { registerCredentialsForDcApi } from '../openid4vc/dcApi'

export type CredentialRecord = W3cCredentialRecord | SdJwtVcRecord | MdocRecord

export async function getCredential(agent: BaseAgent, credentialId: CredentialForDisplayId): Promise<CredentialRecord> {
  if (credentialId.startsWith('w3c-credential-')) {
    const w3cCredentialId = credentialId.replace('w3c-credential-', '')
    return agent.w3cCredentials.getCredentialRecordById(w3cCredentialId)
  }

  if (credentialId.startsWith('sd-jwt-vc')) {
    const sdJwtVcId = credentialId.replace('sd-jwt-vc-', '')
    return agent.sdJwtVc.getById(sdJwtVcId)
  }

  if (credentialId.startsWith('mdoc-')) {
    const mdocId = credentialId.replace('mdoc-', '')
    return agent.mdoc.getById(mdocId)
  }

  throw new Error('Unsupported record type')
}

export async function updateCredential(agent: BaseAgent, credentialRecord: CredentialRecord) {
  if (credentialRecord instanceof W3cCredentialRecord) {
    await agent.dependencyManager.resolve(W3cCredentialRepository).update(agent.context, credentialRecord)
  } else if (credentialRecord instanceof MdocRecord) {
    await agent.dependencyManager.resolve(MdocRepository).update(agent.context, credentialRecord)
  } else {
    await agent.dependencyManager.resolve(SdJwtVcRepository).update(agent.context, credentialRecord)
  }

  // Update database when we update a credential
  await registerCredentialsForDcApi(agent)
}

export async function storeCredential(paradym: ParadymWalletSdk, credentialRecord: CredentialRecord) {
  if (credentialRecord instanceof W3cCredentialRecord) {
    await paradym.agent.dependencyManager.resolve(W3cCredentialRepository).save(paradym.agent.context, credentialRecord)
  } else if (credentialRecord instanceof MdocRecord) {
    await paradym.agent.dependencyManager.resolve(MdocRepository).save(paradym.agent.context, credentialRecord)
  } else {
    await paradym.agent.dependencyManager.resolve(SdJwtVcRepository).save(paradym.agent.context, credentialRecord)
  }

  // Update database when we store a credential
  await registerCredentialsForDcApi(paradym.agent)
}

export async function deleteCredential(agent: BaseAgent, credentialId: CredentialForDisplayId) {
  if (credentialId.startsWith('w3c-credential-')) {
    const w3cCredentialId = credentialId.replace('w3c-credential-', '')
    await agent.w3cCredentials.removeCredentialRecord(w3cCredentialId)
  } else if (credentialId.startsWith('sd-jwt-vc')) {
    const sdJwtVcId = credentialId.replace('sd-jwt-vc-', '')
    await agent.sdJwtVc.deleteById(sdJwtVcId)
  } else if (credentialId.startsWith('mdoc-')) {
    const mdocId = credentialId.replace('mdoc-', '')
    await agent.mdoc.deleteById(mdocId)
  }

  // Update database when we delete a credential
  await registerCredentialsForDcApi(agent)
}
