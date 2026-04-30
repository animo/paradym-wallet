import { type DigitalCredentialsRequest, sendResponse } from '@animo-id/expo-digital-credentials-api'
import { getAptitudeSelection } from '@animo-id/expo-digital-credentials-api-aptitude-consortium'
import type { CredentialsForProofRequest } from '../openid4vc/func/resolveCredentialRequest'
import { shareCredentials } from '../openid4vc/func/shareCredentials'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'

export type DcApiSendResponseOptions = {
  paradym: ParadymWalletSdk
  resolvedRequest: CredentialsForProofRequest
  dcRequest: DigitalCredentialsRequest
}

const stripCredentialPrefix = (credentialId: string) =>
  credentialId.replace(/^(sd-jwt-vc-|mdoc-|w3c-credential-|w3c-v2-credential-)/, '')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getDcApiProtocol(dcRequest: DigitalCredentialsRequest) {
  const requestIndex = getAptitudeSelection(dcRequest)?.requestIdx ?? dcRequest.selectedEntry?.providerIndex ?? 0
  const requestEntry =
    dcRequest.request && 'requests' in dcRequest.request
      ? dcRequest.request.requests[requestIndex]
      : dcRequest.request?.providers?.[requestIndex]

  if (!requestEntry?.protocol) {
    throw new Error('Missing Digital Credentials API protocol in request')
  }

  return requestEntry.protocol
}

function getDcApiResponseData(responseMode: unknown, authorizationResponse: unknown) {
  if (responseMode === 'dc_api.jwt') {
    const response = isRecord(authorizationResponse) ? authorizationResponse.response : undefined
    if (typeof response !== 'string' || response.length === 0) {
      throw new Error('Expected dc_api.jwt response data to contain a response string')
    }

    return { response }
  }

  if (responseMode !== undefined && responseMode !== 'dc_api') {
    throw new Error(`Unsupported Digital Credentials API response_mode '${String(responseMode)}'`)
  }

  if (!isRecord(authorizationResponse)) {
    throw new Error('Expected Digital Credentials API response data to be an object')
  }

  return authorizationResponse
}

function getLegacySelectedCredentials(
  resolvedRequest: CredentialsForProofRequest,
  dcRequest: DigitalCredentialsRequest
) {
  if (!dcRequest.selectedEntry) throw new Error('Missing DC API credential selection')

  return {
    [resolvedRequest.formattedSubmission.entries[0].inputDescriptorId]: stripCredentialPrefix(
      dcRequest.selectedEntry.credentialId
    ),
  }
}

export async function dcApiSendResponse({ paradym, resolvedRequest, dcRequest }: DcApiSendResponseOptions) {
  const aptitudeSelection = getAptitudeSelection(dcRequest)
  const selectedCredentials: Record<string, string> = aptitudeSelection
    ? Object.fromEntries(
        aptitudeSelection.slots
          .filter((slot) => !slot.entryId.startsWith('__none__'))
          .map((slot) => [slot.dcql_id, stripCredentialPrefix(slot.credential_id)])
      )
    : getLegacySelectedCredentials(resolvedRequest, dcRequest)

  const result = await shareCredentials({
    paradym,
    resolvedRequest,
    selectedCredentials,
  })

  paradym.logger.debug('Sending response for Digital Credentials API', {
    result,
  })

  const data = getDcApiResponseData(resolvedRequest.authorizationRequest.response_mode, result.authorizationResponse)

  sendResponse({
    response: JSON.stringify({
      protocol: getDcApiProtocol(dcRequest),
      data,
    }),
  })
}
