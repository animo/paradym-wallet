import { Linking } from 'react-native'
import { assertAgentType } from '../../agent'
import { ParadymWalletBiometricAuthenticationError } from '../../error'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { selectEudiDcqlCredentialsForRequest } from '../dcql/eudiDcql'
import type { CredentialsForProofRequest } from '../func/resolveCredentialRequest'
import { getOpenId4VpTransactionDataResponse } from '../transactionDataRegistry'

export type ShareCredentialsOptions = {
  paradym: ParadymWalletSdk
  resolvedRequest: CredentialsForProofRequest
  selectedCredentials?: { [inputDescriptorId: string]: string }
}

export const shareCredentials = async ({
  paradym,
  resolvedRequest,
  selectedCredentials = {},
}: ShareCredentialsOptions) => {
  assertAgentType(paradym.agent, 'openid4vc')

  const { authorizationRequest } = resolvedRequest
  const eudiDcql = 'eudiDcql' in resolvedRequest ? resolvedRequest.eudiDcql : undefined
  if (
    !resolvedRequest.credentialsForRequest?.areRequirementsSatisfied &&
    !(eudiDcql && resolvedRequest.formattedSubmission.areAllSatisfied)
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

              // NOTE: we don't support single-use credentials for PEX
              return [entry.inputDescriptorId, [credential]]
            })
          )
        )
      )
    : undefined

  const dcqlCredentials = eudiDcql ? selectEudiDcqlCredentialsForRequest(eudiDcql, selectedCredentials) : undefined

  const transactionData = getOpenId4VpTransactionDataResponse({
    authorizationRequest: resolvedRequest.authorizationRequest,
    transactionData: resolvedRequest.transactionData,
    selectedCredentials,
    hasCredentialForInputDescriptor: (id) => !!(dcqlCredentials?.[id] || presentationExchangeCredentials?.[id]),
  })

  try {
    const result = await paradym.agent.openid4vc.holder.acceptOpenId4VpAuthorizationRequest({
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
      transactionData,
      origin: resolvedRequest.origin,
    })

    // if redirect_uri is provided, open it in the browser
    // Even if the response returned an error, we must open this uri
    if (result.redirectUri) {
      await Linking.openURL(result.redirectUri)
    }

    if (result.serverResponse && (result.serverResponse.status < 200 || result.serverResponse.status > 299)) {
      paradym.logger.error('Error while accepting authorization request', {
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
    throw ParadymWalletBiometricAuthenticationError.tryParseFromError(error) ?? error
  }
}
