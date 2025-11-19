import type { DigitalCredentialsRequest } from '@animo-id/expo-digital-credentials-api'
import { getCredentialsForProofRequest } from '../openid4vc/getCredentialsForProofRequest'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { getHostNameFromUrl } from '../utils/url'

export type DcApiResolveRequestOptions = {
  paradym: ParadymWalletSdk
  request: DigitalCredentialsRequest
}

export async function dcApiResolveRequest({ paradym, request }: DcApiResolveRequestOptions) {
  const providerRequest = request.request.requests
    ? request.request.requests[request.selectedEntry.providerIndex].data
    : request.request.providers[request.selectedEntry.providerIndex].request

  const authorizationRequestPayload =
    typeof providerRequest === 'string' ? JSON.parse(providerRequest) : providerRequest

  // TODO: should allow limiting it to a specific credential (as we already know the credential id)
  const result = await getCredentialsForProofRequest({
    paradym,
    requestPayload: authorizationRequestPayload,
    origin: request.origin,
  })

  if (result.formattedSubmission.entries.length !== 1) {
    throw new Error('Only requests for a single credential supported for digital credentials api')
  }

  paradym.logger.debug('Resolved request', {
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
