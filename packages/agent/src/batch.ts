import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord, W3cV2CredentialRecord } from '@credo-ts/core'
import { RefreshPidUseCase } from '../../../apps/easypid/src/use-cases/RefreshPidUseCase'
import type { EitherAgent } from './agent'
import { getCredentialCategoryMetadata } from './credentialCategoryMetadata'
import { getRefreshCredentialMetadata } from './openid4vc/refreshMetadata'

export async function refreshPid({
  agent,
  sdJwt,
  mdoc,
  batchSize,
}: { agent: EitherAgent; sdJwt?: SdJwtVcRecord; mdoc?: MdocRecord; batchSize?: number }) {
  agent.config.logger.info('refreshing PID')
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
 * @todo this should be refactored since it only refreshes when
 * you use the cred, but this should actually happen continuously
 * so that also if it expires it is refreshed
 */
export async function refreshPidIfNeeded<
  CredentialRecord extends W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord,
>(agent: EitherAgent, credentialRecord: CredentialRecord) {
  // Try to refresh the pid when we run out
  // TODO: we should probably move this somewhere else at some point
  const categoryMetadata = getCredentialCategoryMetadata(credentialRecord)
  const refreshMetadata = getRefreshCredentialMetadata(credentialRecord)
  if (
    categoryMetadata?.credentialCategory === 'DE-PID' &&
    refreshMetadata &&
    credentialRecord.credentialInstances.length === 1
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
}
