import { type DigitalCredentialsRequest, sendResponse, sendErrorResponse } from '@animo-id/expo-digital-credentials-api'
import type { EitherAgent } from '../agent'
import { type CredentialsForProofRequest, getCredentialsForProofRequest, shareProof } from '../invitation'
import { getHostNameFromUrl } from '@package/utils'

export async function resolveRequestForDcApi({
  agent,
  request,
}: { agent: EitherAgent; request: DigitalCredentialsRequest }) {
  const provider = request.request.providers[request.selectedEntry.providerIndex]

  // verifiable-credentials.dev contains a client_id
  const { client_id, ...filteredRequest } = JSON.parse(provider.request)

  // TODO: should allow limiting it to a specific credential
  const result = await getCredentialsForProofRequest({
    agent,
    // FIXME: we already have the parsed request, which is supported by Credo, but not the API definition of Credo
    uri: filteredRequest,
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

  // TODO: this should be create response method
  const result = await shareProof({
    agent,
    resolvedRequest,
    selectedCredentials: {
      [firstEntry.inputDescriptorId]: dcRequest.selectedEntry.credentialId,
    },
  })

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const response = (result as any).response

  agent.config.logger.debug('Sending response for Digital Credentials API', {
    result,
  })

  sendResponse({
    response: JSON.stringify(response),
  })
}

export async function sendErrorResponseForDcApi(errorMessage: string) {
  sendErrorResponse({
    errorMessage,
  })
}
