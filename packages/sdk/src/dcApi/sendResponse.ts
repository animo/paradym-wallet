import { type DigitalCredentialsRequest, sendResponse } from '@animo-id/expo-digital-credentials-api'
import { getAptitudeSelection } from '@animo-id/expo-digital-credentials-api-aptitude-consortium'
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

const stripCredentialPrefix = (credentialId: string) =>
  credentialId.replace(/^(sd-jwt-vc-|mdoc-|w3c-credential-|w3c-v2-credential-)/, '')

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
  selectedCredentialId: string | undefined
) {
  const firstEntry = resolvedRequest.formattedSubmission.entries[0]
  if (!firstEntry?.isSatisfied || !selectedCredentialId) {
    throw new Error('Expected one selected credential for DC API response')
  }

  return {
    [firstEntry.inputDescriptorId]: stripCredentialPrefix(selectedCredentialId),
  }
}

export async function dcApiSendResponse({ paradym, resolvedRequest, dcRequest }: DcApiSendResponseOptions) {
  const { protocol, selectedCredentialId } = getDcApiRequestContext(dcRequest)
  const aptitudeSelection = getAptitudeSelection(dcRequest)
  const selectedCredentials: Record<string, string> = aptitudeSelection
    ? Object.fromEntries(
        aptitudeSelection.creds
          .filter((credential) => !credential.entryId.startsWith('__none__'))
          .map((credential) => {
            if (!credential.metadata?.dcql_id) throw new Error('Missing DCQL id in DC API selection metadata')

            return [
              credential.metadata.dcql_id,
              credential.metadata.credential_id ?? stripCredentialPrefix(credential.entryId),
            ]
          })
      )
    : getLegacySelectedCredentials(resolvedRequest, selectedCredentialId)

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
      protocol,
      data,
    }),
  })
}
