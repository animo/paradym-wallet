import {
  type DigitalCredentialsRequest,
  sendCreateErrorResponse,
  sendCreateResponse,
  sendErrorResponse,
  sendResponse,
} from '@animo-id/expo-digital-credentials-api'
import { getHostNameFromUrl } from '@package/utils'
import type { EitherAgent } from '../agent'
import { type CredentialsForProofRequest, getCredentialsForProofRequest } from '../invitation'
import { shareProof } from '../invitation/shareProof'

export async function resolveRequestForDcApi({
  agent,
  request,
}: {
  agent: EitherAgent
  request: DigitalCredentialsRequest
}) {
  type DigitalCredentialsSelection = {
    requestIdx: number
    creds: Array<{
      entryId: string
      dcqlId?: string
      matchedClaimPaths?: Array<Array<string | number | null>>
    }>
  }
  const dcRequest = request as DigitalCredentialsRequest & { selection?: DigitalCredentialsSelection }
  const requestIndex = dcRequest.selection?.requestIdx ?? dcRequest.selectedEntry?.providerIndex ?? 0
  const providerRequest =
    'requests' in dcRequest.request && dcRequest.request.requests
      ? dcRequest.request.requests[requestIndex]?.data
      : dcRequest.request.providers?.[requestIndex]?.request

  if (!providerRequest) {
    throw new Error('Missing provider request for Digital Credentials API request')
  }

  const authorizationRequestPayload =
    typeof providerRequest === 'string' ? JSON.parse(providerRequest) : providerRequest

  const result = await getCredentialsForProofRequest({
    agent,
    requestPayload: authorizationRequestPayload,
    origin: request.origin,
  })

  const selectedEntryIds =
    dcRequest.selection?.creds?.map((credential) => credential.entryId) ??
    (dcRequest.selectedEntry?.credentialId ? [dcRequest.selectedEntry.credentialId] : [])

  agent.config.logger.debug('Resolved request', {
    result,
  })
  const formattedSubmission =
    selectedEntryIds.length > 0
      ? (() => {
          const selectedSet = new Set(selectedEntryIds)
          const filteredEntries = result.formattedSubmission.entries
            .map((entry) => {
              if (!entry.isSatisfied) return entry
              const credentials = entry.credentials.filter((credential) =>
                selectedSet.has(credential.credential.record.id)
              )
              if (credentials.length === 0) return undefined

              return {
                ...entry,
                credentials:
                  credentials as [typeof credentials[number], ...Array<typeof credentials[number]>],
              }
            })
            .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)

          if (filteredEntries.length === 0) {
            throw new Error('Could not find selected credential(s) in formatted submission')
          }

          return {
            ...result.formattedSubmission,
            entries: filteredEntries,
          }
        })()
      : result.formattedSubmission

  return {
    ...result,
    formattedSubmission,
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
  acceptTransactionData,
  selectedCredentials,
}: {
  agent: EitherAgent
  resolvedRequest: CredentialsForProofRequest
  dcRequest: DigitalCredentialsRequest
  acceptTransactionData?: Array<{ credentialId: string; additionalPayload?: object }>
  selectedCredentials?: Record<string, string>
}) {
  const resolvedSelectedCredentials =
    selectedCredentials ??
    Object.fromEntries(
      resolvedRequest.formattedSubmission.entries
        .filter((entry): entry is typeof entry & { isSatisfied: true } => entry.isSatisfied)
        .map((entry) => [entry.inputDescriptorId, entry.credentials[0].credential.record.id])
    )

  const result = await shareProof({
    agent,
    resolvedRequest,
    selectedCredentials: resolvedSelectedCredentials,
    acceptTransactionData,
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

export async function sendCreateResponseForDcApi({
  response,
  type,
  newEntryId,
}: {
  response: string
  type?: string
  newEntryId?: string
}) {
  sendCreateResponse({
    response,
    type,
    newEntryId,
  })
}

export async function sendCreateErrorResponseForDcApi(errorMessage: string) {
  sendCreateErrorResponse({
    errorMessage,
  })
}
