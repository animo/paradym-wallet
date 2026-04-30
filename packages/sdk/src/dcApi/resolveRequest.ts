import type { DigitalCredentialsRequest } from '@animo-id/expo-digital-credentials-api'
import { getAptitudeSelection } from '@animo-id/expo-digital-credentials-api-aptitude-consortium'
import { resolveCredentialRequest } from '../openid4vc/func/resolveCredentialRequest'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { getHostNameFromUrl } from '../utils/url'

export type DcApiResolveRequestOptions = {
  paradym: ParadymWalletSdk
  request: DigitalCredentialsRequest
}

export async function dcApiResolveRequest({ paradym, request }: DcApiResolveRequestOptions) {
  const requestIndex = getAptitudeSelection(request)?.requestIdx ?? request.selectedEntry?.providerIndex ?? 0
  const providerRequest =
    request.request && 'requests' in request.request
      ? request.request.requests[requestIndex]?.data
      : request.request?.providers?.[requestIndex]?.request

  if (!providerRequest) {
    throw new Error('Missing provider request for Digital Credentials API request')
  }

  const authorizationRequestPayload =
    typeof providerRequest === 'string' ? JSON.parse(providerRequest) : providerRequest

  // TODO: should allow limiting it to a specific credential (as we already know the credential id)
  const result = await resolveCredentialRequest({
    paradym,
    requestPayload: authorizationRequestPayload,
    origin: request.origin ?? undefined,
  })

  paradym.logger.debug('Resolved request', {
    result,
  })

  return {
    ...result,
    verifier: {
      ...result.verifier,
      hostName: request.origin ? getHostNameFromUrl(request.origin) : undefined,
    },
  }
}
