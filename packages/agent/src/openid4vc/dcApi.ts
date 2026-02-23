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
  type DigitalCredentialsSelectionCredMetadata = {
    credential_id?: string
    transaction_data_indices?: number[]
    [key: string]: unknown
  }
  type DigitalCredentialsSelection = {
    requestIdx: number
    creds: Array<{
      entryId: string
      dcqlId?: string
      matchedClaimPaths?: Array<Array<string | number | null>>
      metadata?: DigitalCredentialsSelectionCredMetadata
    }>
  }
  type SelectedEntry = {
    credentialId?: string
    providerIndex?: number
  }
  const dcRequest = request as DigitalCredentialsRequest & {
    selection?: DigitalCredentialsSelection
    selectedEntry?: SelectedEntry
  }
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

  const selectionCreds =
    dcRequest.selection?.creds ??
    (dcRequest.selectedEntry?.credentialId ? [{ entryId: dcRequest.selectedEntry.credentialId }] : [])
  const selectedEntryIds = selectionCreds.map((credential) => credential.entryId)

  const getRecordId = (credential: { credential: { record: { id: string } } }) => credential.credential.record.id

  const selectedByQueryId = new Map<string, { recordId: string; metadata?: DigitalCredentialsSelectionCredMetadata }>()
  for (const credential of selectionCreds) {
    let queryId = credential.dcqlId ?? credential.metadata?.credential_id
    if (!queryId) {
      const entry = result.formattedSubmission.entries.find(
        (candidate) =>
          candidate.isSatisfied &&
          candidate.credentials.some((candidateCredential) => getRecordId(candidateCredential) === credential.entryId)
      )
      if (entry) queryId = entry.inputDescriptorId
    }
    if (queryId) {
      selectedByQueryId.set(queryId, { recordId: credential.entryId, metadata: credential.metadata })
    }
  }

  agent.config.logger.debug('Resolved request', {
    result,
  })
  const formattedSubmission =
    selectionCreds.length > 0
      ? (() => {
          const selectedSet = new Set(selectedEntryIds)
          const filteredEntries = result.formattedSubmission.entries
            .map((entry) => {
              if (!entry.isSatisfied) return entry
              const selectedForQuery = selectedByQueryId.get(entry.inputDescriptorId)
              const credentials = entry.credentials.filter((credential) => {
                const recordId = getRecordId(credential)
                if (selectedForQuery) return recordId === selectedForQuery.recordId
                return selectedSet.has(recordId)
              })
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

  let transactionData = result.transactionData
  if (selectionCreds.length > 0 && Array.isArray(transactionData) && transactionData.length > 0) {
    const indexToQueryIds = new Map<number, string[]>()
    for (const credential of selectionCreds) {
      const indices = credential.metadata?.transaction_data_indices
      if (!Array.isArray(indices) || indices.length === 0) continue

      const queryId = credential.dcqlId ?? credential.metadata?.credential_id
      if (!queryId) continue

      for (const index of indices) {
        const existing = indexToQueryIds.get(index)
        if (existing) {
          if (!existing.includes(queryId)) existing.push(queryId)
        } else {
          indexToQueryIds.set(index, [queryId])
        }
      }
    }

    if (indexToQueryIds.size > 0) {
      type TransactionDataEntry = NonNullable<typeof transactionData>[number]
      transactionData = transactionData.map((entry, index) => {
        const selectedIds = indexToQueryIds.get(index)
        if (!selectedIds || selectedIds.length === 0) return entry
        return {
          ...(entry as TransactionDataEntry),
          matchedCredentialIds: selectedIds,
        }
      }) as TransactionDataEntry[]
    }
  }

  return {
    ...result,
    formattedSubmission,
    transactionData,
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
