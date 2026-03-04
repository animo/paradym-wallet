import { type DigitalCredentialsRequest, sendResponse } from '@animo-id/expo-digital-credentials-api'
import type { CredentialsForProofRequest } from '../openid4vc/func/resolveCredentialRequest'
import { shareCredentials } from '../openid4vc/func/shareCredentials'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'

export type DcApiSendResponseOptions = {
  paradym: ParadymWalletSdk
  resolvedRequest: CredentialsForProofRequest
  dcRequest: DigitalCredentialsRequest
}

export async function dcApiSendResponse({ paradym, resolvedRequest, dcRequest }: DcApiSendResponseOptions) {
  const firstEntry = resolvedRequest.formattedSubmission.entries[0]
  if (!firstEntry.isSatisfied) {
    paradym.logger.debug('Expected one entry for DC API response', {
      resolvedRequest,
      dcRequest,
    })
    throw new Error('Expected one entry for DC API response')
  }

  const result = await shareCredentials({
    paradym,
    resolvedRequest,
    selectedCredentials: {
      [firstEntry.inputDescriptorId]: dcRequest.selectedEntry.credentialId,
    },
  })

  paradym.logger.debug('Sending response for Digital Credentials API', {
    result,
  })

  sendResponse({
    response: JSON.stringify(result.authorizationResponse),
  })
}
