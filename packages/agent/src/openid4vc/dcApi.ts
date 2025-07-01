import { type DigitalCredentialsRequest, sendErrorResponse, sendResponse } from '@animo-id/expo-digital-credentials-api'
import { getHostNameFromUrl } from '@package/utils'
import type { EitherAgent } from '../agent'
import { type CredentialsForProofRequest, getCredentialsForProofRequest, shareProof } from '../invitation'

export async function resolveRequestForDcApi({
  agent,
  request,
}: { agent: EitherAgent; request: DigitalCredentialsRequest }) {
  const providerRequest = request.request.requests
    ? request.request.requests[request.selectedEntry.providerIndex].data
    : request.request.providers[request.selectedEntry.providerIndex].request

  const authorizationRequestPayload =
    typeof providerRequest === 'string' ? JSON.parse(providerRequest) : providerRequest

  // TODO: should allow limiting it to a specific credential (as we already know the credential id)
  const result = await getCredentialsForProofRequest({
    agent,
    requestPayload: authorizationRequestPayload,
    origin: request.origin,
  })

  if (result.formattedSubmission.entries.length !== 1) {
    throw new Error('Only requests for a single credential supported for digital credentials api')
  }

  agent.config.logger.debug('Resolved request', {
    result,
  })
  if (result.formattedSubmission.entries[0].isSatisfied) {
    const credential = result.formattedSubmission.entries[0].credentials.find(
      (c) => c.credential.record.id === request.selectedEntry.credentialId
    )
    if (!credential)
      throw new Error(
        `Could not find selected credential with id '${request.selectedEntry.credentialId}' in formatted submission`
      )

    // Update to only contain the already selected credential
    result.formattedSubmission.entries[0].credentials = [credential]
  }

  return {
    ...result,
    verifier: {
      ...result.verifier,
      hostName: getHostNameFromUrl(request.origin),
    },
  }
}

export async function sendResponseForDcApi({
  agent,
  resolvedRequest,
  dcRequest,
}: { agent: EitherAgent; resolvedRequest: CredentialsForProofRequest; dcRequest: DigitalCredentialsRequest }) {
  const firstEntry = resolvedRequest.formattedSubmission.entries[0]
  if (!firstEntry.isSatisfied) {
    agent.config.logger.debug('Expected one entry for DC API response', {
      resolvedRequest,
      dcRequest,
    })
    throw new Error('Expected one entry for DC API response')
  }

  const result = await shareProof({
    agent,
    resolvedRequest,
    selectedCredentials: {
      [firstEntry.inputDescriptorId]: dcRequest.selectedEntry.credentialId,
    },
  })

  agent.config.logger.debug('Sending response for Digital Credentials API', {
    result,
  })

  sendResponse({
    response: JSON.stringify(result.authorizationResponse),
  })
}

export async function sendErrorResponseForDcApi(errorMessage: string) {
  sendErrorResponse({
    errorMessage,
  })
}
