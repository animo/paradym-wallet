import { Linking } from 'react-native'
import type { EitherAgent } from '../agent'
import { handleBatchCredential } from '../batch'
import { BiometricAuthenticationError } from './error'
import type { CredentialsForProofRequest } from './handler'

export const shareProof = async ({
  agent,
  resolvedRequest,
  selectedCredentials,
}: {
  agent: EitherAgent
  resolvedRequest: CredentialsForProofRequest
  selectedCredentials: { [inputDescriptorId: string]: string }
}) => {
  const { authorizationRequest } = resolvedRequest
  if (
    !resolvedRequest.credentialsForRequest?.areRequirementsSatisfied &&
    !resolvedRequest.queryResult?.canBeSatisfied
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

              return [entry.inputDescriptorId, [credentialRecord]] as [string, (typeof credentialRecord)[]]
            })
          )
        )
      )
    : undefined

  // TODO: support credential selection for DCQL
  const dcqlCredentials = resolvedRequest.queryResult
    ? Object.fromEntries(
        await Promise.all(
          Object.entries(
            agent.modules.openId4VcHolder.selectCredentialsForDcqlRequest(resolvedRequest.queryResult)
          ).map(async ([queryCredentialId, credential]) => {
            // Optionally use a batch credential
            const credentialRecord = await handleBatchCredential(agent, credential.credentialRecord)

            return [queryCredentialId, { ...credential, credentialRecord }]
          })
        )
      )
    : undefined

  try {
    const result = await agent.modules.openId4VcHolder.acceptSiopAuthorizationRequest({
      authorizationRequest,
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
    })

    // if redirect_uri is provided, open it in the browser
    // Even if the response returned an error, we must open this uri
    if (result.redirectUri) {
      await Linking.openURL(result.redirectUri)
    }

    if (result.serverResponse.status < 200 || result.serverResponse.status > 299) {
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
