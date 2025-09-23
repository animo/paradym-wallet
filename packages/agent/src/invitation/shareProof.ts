import {
  ClaimFormat,
  type DcqlCredentialsForRequest,
  type DcqlQueryResult,
  type JsonObject,
  type MdocNameSpaces,
  type MdocRecord,
  type SdJwtVcRecord,
  type W3cCredentialRecord,
  type W3cV2CredentialRecord,
} from '@credo-ts/core'
import { Linking } from 'react-native'
import type { EitherAgent } from '../agent'
import { handleBatchCredential } from '../batch'
import { BiometricAuthenticationError } from './error'
import type { CredentialsForProofRequest } from './handler'
import { getFormattedTransactionData } from './transactions'

export const shareProof = async ({
  agent,
  resolvedRequest,
  selectedCredentials,
  acceptTransactionData,
}: {
  agent: EitherAgent
  resolvedRequest: CredentialsForProofRequest
  selectedCredentials: { [inputDescriptorId: string]: string }
  // FIXME: Should be a more complex structure allowing which credential to use for which entry
  acceptTransactionData?: boolean
}) => {
  const { authorizationRequest } = resolvedRequest
  if (
    !resolvedRequest.credentialsForRequest?.areRequirementsSatisfied &&
    !resolvedRequest.queryResult?.can_be_satisfied
  ) {
    throw new Error('Requirements from proof request are not satisfied')
  }

  // Map all requirements and entries to a credential record. If a credential record for an
  // input descriptor has been provided in `selectedCredentials` we will use that. Otherwise
  // it will pick the first available credential.
  const presentationExchangeCredentials = resolvedRequest.credentialsForRequest
    ? Object.fromEntries(
        await Promise.all(
          resolvedRequest.credentialsForRequest.requirements.flatMap((requirement) =>
            requirement.submissionEntry.slice(0, requirement.needsCount).map(async (entry) => {
              const credentialId = selectedCredentials[entry.inputDescriptorId]
              const credential =
                entry.verifiableCredentials.find((vc) => vc.credentialRecord.id === credentialId) ??
                entry.verifiableCredentials[0]

              // Optionally use a batch credential
              const credentialRecord = await handleBatchCredential(agent, credential.credentialRecord)

              return [entry.inputDescriptorId, [{ ...credential, credentialRecord }]]
            })
          )
        )
      )
    : undefined

  const dcqlCredentials = resolvedRequest.queryResult
    ? Object.fromEntries(
        await Promise.all(
          Object.entries(
            Object.keys(selectedCredentials).length > 0
              ? getSelectedCredentialsForRequest(resolvedRequest.queryResult, selectedCredentials)
              : agent.modules.openId4VcHolder.selectCredentialsForDcqlRequest(resolvedRequest.queryResult)
          ).map(async ([queryCredentialId, credentials]) => {
            // Optionally use a batch credential
            const updatedCredentials = await Promise.all(
              credentials.map(async (credential) => ({
                ...credential,
                credentialRecord: await handleBatchCredential(agent, credential.credentialRecord),
              }))
            )

            return [queryCredentialId, updatedCredentials]
          })
        )
      )
    : undefined

  const cardForSigningId = getFormattedTransactionData(resolvedRequest)?.cardForSigningId

  try {
    const result = await agent.modules.openId4VcHolder.acceptOpenId4VpAuthorizationRequest({
      authorizationRequestPayload: authorizationRequest,
      presentationExchange: presentationExchangeCredentials
        ? {
            credentials: presentationExchangeCredentials,
          }
        : undefined,
      dcql: dcqlCredentials
        ? {
            credentials: dcqlCredentials,
          }
        : undefined,
      transactionData:
        resolvedRequest.transactionData && acceptTransactionData && cardForSigningId
          ? [{ credentialId: cardForSigningId }]
          : undefined,
      origin: resolvedRequest.origin,
    })

    // if redirect_uri is provided, open it in the browser
    // Even if the response returned an error, we must open this uri
    if (result.redirectUri) {
      await Linking.openURL(result.redirectUri)
    }

    if (result.serverResponse && (result.serverResponse.status < 200 || result.serverResponse.status > 299)) {
      agent.config.logger.error('Error while accepting authorization request', {
        authorizationRequest,
        response: result.authorizationResponse,
        responsePayload: result.authorizationResponsePayload,
      })
      throw new Error(
        `Error while accepting authorization request. ${JSON.stringify(result.serverResponse.body, null, 2)}`
      )
    }

    return result
  } catch (error) {
    // Handle biometric authentication errors
    throw BiometricAuthenticationError.tryParseFromError(error) ?? error
  }
}

/**
 * Selects the credentials to use based on the output from `getCredentialsForRequest`
 * Use this method if you don't want to manually select the credentials yourself.
 */
function getSelectedCredentialsForRequest(
  dcqlQueryResult: DcqlQueryResult,
  selectedCredentials: { [credentialQueryId: string]: string }
): DcqlCredentialsForRequest {
  if (!dcqlQueryResult.can_be_satisfied) {
    throw new Error('Cannot select the credentials for the dcql query presentation if the request cannot be satisfied')
  }

  const credentials: DcqlCredentialsForRequest = {}

  type WithRecord<T> = T & {
    record: MdocRecord | SdJwtVcRecord | W3cCredentialRecord | W3cV2CredentialRecord
  }

  for (const [credentialQueryId, credentialRecordId] of Object.entries(selectedCredentials)) {
    const matchesForCredentialQuery = dcqlQueryResult.credential_matches[credentialQueryId]
    if (matchesForCredentialQuery.success) {
      const validCredentialMatch = matchesForCredentialQuery.valid_credentials.find(
        (credential) => (credential as WithRecord<typeof credential>).record.id === credentialRecordId
      )

      if (!validCredentialMatch) {
        throw new Error(
          `Could not find credential record ${credentialRecordId} in valid credential matches for credentialQueryId ${credentialQueryId}`
        )
      }

      // TODO: fix the typing, make selection in Credo easier
      const matchWithRecord = validCredentialMatch as typeof validCredentialMatch & {
        record: MdocRecord | SdJwtVcRecord | W3cCredentialRecord | W3cV2CredentialRecord
      }

      if (matchWithRecord.record.type === 'MdocRecord') {
        credentials[credentialQueryId] = [
          {
            claimFormat: ClaimFormat.MsoMdoc,
            credentialRecord: matchWithRecord.record,
            disclosedPayload: matchWithRecord.claims.valid_claim_sets[0].output as MdocNameSpaces,
          },
        ]
      } else if (matchWithRecord.record.type === 'SdJwtVcRecord') {
        credentials[credentialQueryId] = [
          {
            claimFormat: ClaimFormat.SdJwtDc,
            credentialRecord: matchWithRecord.record,
            disclosedPayload: matchWithRecord.claims.valid_claim_sets[0].output as JsonObject,
          },
        ]
      }
    }
  }

  return credentials
}
