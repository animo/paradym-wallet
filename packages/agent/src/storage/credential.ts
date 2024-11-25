import {
  MdocRecord,
  MdocRepository,
  type SdJwtVcRecord,
  SdJwtVcRepository,
  W3cCredentialRecord,
  W3cCredentialRepository,
} from '@credo-ts/core'
import type { EitherAgent } from '../agent'
import type { CredentialForDisplayId } from '../hooks'

type CredentialRecord = W3cCredentialRecord | SdJwtVcRecord | MdocRecord

export async function getCredential(
  agent: EitherAgent,
  credentialId: CredentialForDisplayId
): Promise<CredentialRecord> {
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

export async function updateCredential(agent: EitherAgent, credentialRecord: CredentialRecord) {
  if (credentialRecord instanceof W3cCredentialRecord) {
    await agent.dependencyManager.resolve(W3cCredentialRepository).update(agent.context, credentialRecord)
  } else if (credentialRecord instanceof MdocRecord) {
    await agent.dependencyManager.resolve(MdocRepository).update(agent.context, credentialRecord)
  } else {
    await agent.dependencyManager.resolve(SdJwtVcRepository).update(agent.context, credentialRecord)
  }
}
export async function storeCredential(agent: EitherAgent, credentialRecord: CredentialRecord) {
  if (credentialRecord instanceof W3cCredentialRecord) {
    await agent.dependencyManager.resolve(W3cCredentialRepository).save(agent.context, credentialRecord)
  } else if (credentialRecord instanceof MdocRecord) {
    await agent.dependencyManager.resolve(MdocRepository).save(agent.context, credentialRecord)
  } else {
    await agent.dependencyManager.resolve(SdJwtVcRepository).save(agent.context, credentialRecord)
  }
}

export async function deleteCredential(agent: EitherAgent, credentialId: CredentialForDisplayId) {
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
}
