import { type DigitalCredentialsRequest, sendResponse } from '@animo-id/expo-digital-credentials-api'
import type { CredentialsForProofRequest } from '../openid4vc/func/resolveCredentialRequest'
import { shareCredentials } from '../openid4vc/func/shareCredentials'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { getDcApiRequestContext } from './resolveRequest'
import { isRecord } from './utils'

export type DcApiSendResponseOptions = {
  paradym: ParadymWalletSdk
  resolvedRequest: CredentialsForProofRequest
  dcRequest: DigitalCredentialsRequest
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

export async function dcApiSendResponse({ paradym, resolvedRequest, dcRequest }: DcApiSendResponseOptions) {
  const firstEntry = resolvedRequest.formattedSubmission.entries[0]
  if (!firstEntry?.isSatisfied) {
    paradym.logger.debug('Expected one entry for DC API response', {
      resolvedRequest,
      dcRequest,
    })
    throw new Error('Expected one entry for DC API response')
  }

  const { protocol, selectedCredentialId } = getDcApiRequestContext(dcRequest)
  const result = await shareCredentials({
    paradym,
    resolvedRequest,
    selectedCredentials: {
      [firstEntry.inputDescriptorId]: selectedCredentialId,
    },
  })

  paradym.logger.debug('Sending response for Digital Credentials API', {
    result,
  })

  const data = getDcApiResponseData(resolvedRequest.authorizationRequest.response_mode, result.authorizationResponse)

  sendResponse({
    response: JSON.stringify({
      protocol,
      data,
    }),
  })
}
