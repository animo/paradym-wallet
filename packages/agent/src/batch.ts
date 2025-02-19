import { Mdoc, MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@credo-ts/core'
import { RefreshPidUseCase } from '../../../apps/easypid/src/use-cases/RefreshPidUseCase'
import type { EitherAgent } from './agent'
import { getCredentialCategoryMetadata } from './credentialCategoryMetadata'
import { decodeW3cCredential } from './format/credentialEncoding'
import { getBatchCredentialMetadata } from './openid4vc/batchMetadata'
import { getRefreshCredentialMetadata } from './openid4vc/refreshMetadata'
import { updateCredential } from './storage'

export async function refreshPid({
  agent,
  sdJwt,
  mdoc,
  batchSize,
}: { agent: EitherAgent; sdJwt?: SdJwtVcRecord; mdoc?: MdocRecord; batchSize?: number }) {
  console.log('refreshing PID')
  const useCase = await RefreshPidUseCase.initialize({
    agent,
  })

  await useCase.retrieveCredentialsUsingExistingRecords({
    sdJwt,
    mdoc,
    batchSize,
  })
}

/**
 * If available, takes a credential from the batch.
 *
 * @todo: what if batch is gone?
 */
export async function handleBatchCredential<CredentialRecord extends W3cCredentialRecord | SdJwtVcRecord | MdocRecord>(
  agent: EitherAgent,
  credentialRecord: CredentialRecord
): Promise<CredentialRecord> {
  const batchMetadata = getBatchCredentialMetadata(credentialRecord)
  if (!batchMetadata) return credentialRecord

  // TODO: maybe we should also store the main credential in the additional credentials (and rename it)
  // As right now the main one is mostly for display
  const batchCredential = batchMetadata.additionalCredentials.pop()

  // Store the record with the used credential removed. Even if the presentation fails we remove it, as we want to be careful
  // if the presentation was shared
  if (batchCredential) await updateCredential(agent, credentialRecord)

  // Try to refresh the pid when we run out
  // TODO: we should probably move this somewhere else at some point
  const categoryMetadata = getCredentialCategoryMetadata(credentialRecord)
  const refreshMetadata = getRefreshCredentialMetadata(credentialRecord)
  if (
    categoryMetadata?.credentialCategory === 'DE-PID' &&
    refreshMetadata &&
    batchMetadata.additionalCredentials.length === 0
  ) {
    refreshPid({
      agent,
      sdJwt: credentialRecord.type === 'SdJwtVcRecord' ? credentialRecord : undefined,
      mdoc: credentialRecord.type === 'MdocRecord' ? credentialRecord : undefined,
      // Get a batch of 5 for a single record type
      batchSize: 5,
    })
      .catch((error) => {
        // TODO: we should handle the case where the refresh token is expired
        agent.config.logger.error('Error refreshing pid', {
          error,
        })
      })
      .then(() => {
        agent.config.logger.debug('Successfully refreshed PID')
      })
  }

  if (batchCredential) {
    if (credentialRecord instanceof MdocRecord) {
      return new MdocRecord({
        mdoc: Mdoc.fromBase64Url(batchCredential as string),
      }) as CredentialRecord
    }
    if (credentialRecord instanceof SdJwtVcRecord) {
      return new SdJwtVcRecord({
        compactSdJwtVc: batchCredential as string,
      }) as CredentialRecord
    }
    if (credentialRecord instanceof W3cCredentialRecord) {
      return new W3cCredentialRecord({
        tags: { expandedTypes: [] },
        credential: decodeW3cCredential(batchCredential),
      }) as CredentialRecord
    }
  }

  return credentialRecord
}
