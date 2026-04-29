import type { DigitalCredentialsRequest } from '@animo-id/expo-digital-credentials-api'
import { resolveCredentialRequest } from '../openid4vc/func/resolveCredentialRequest'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { getHostNameFromUrl } from '../utils/url'
import { isRecord, parseJsonObject } from './utils'

export type DcApiResolveRequestOptions = {
  paradym: ParadymWalletSdk
  request: DigitalCredentialsRequest
}

type RuntimeDigitalCredentialsRequest = DigitalCredentialsRequest & {
  request?: unknown
  selection?: {
    requestIdx?: number
    creds?: Array<{
      entryId?: string
      metadata?: {
        dcql_id?: string
        credential_id?: string
      }
    }>
  }
  selectedEntry?: {
    credentialId?: string
    providerIndex?: number
  }
  sourceBundle?: unknown
}

export type DcApiSelectedCredential = {
  inputDescriptorId?: string
  credentialRecordId: string
}

function getBundleRequestPayload(sourceBundle: unknown) {
  if (!isRecord(sourceBundle)) return undefined

  const directRequest = sourceBundle['androidx.credentials.BUNDLE_KEY_REQUEST_JSON']
  if (typeof directRequest === 'string') {
    return parseJsonObject(directRequest)
  }

  const retrievalData = Object.entries(sourceBundle).find(([key]) =>
    key.startsWith('androidx.credentials.provider.extra.CREDENTIAL_OPTION_CREDENTIAL_RETRIEVAL_DATA_')
  )?.[1]
  const requestJson = isRecord(retrievalData)
    ? retrievalData['androidx.credentials.BUNDLE_KEY_REQUEST_JSON']
    : undefined

  return typeof requestJson === 'string' ? parseJsonObject(requestJson) : undefined
}

function getDcApiRequestPayload(request: RuntimeDigitalCredentialsRequest) {
  if (typeof request.request === 'string') {
    return parseJsonObject(request.request)
  }

  return isRecord(request.request) ? request.request : getBundleRequestPayload(request.sourceBundle)
}

function normalizeDcApiOrigin(origin: unknown) {
  if (typeof origin !== 'string') return undefined
  if (!origin.startsWith('http://') && !origin.startsWith('https://')) return origin

  return new URL(origin).origin
}

function getDcApiOrigin(request: RuntimeDigitalCredentialsRequest) {
  const sourceBundleOrigin = isRecord(request.sourceBundle)
    ? request.sourceBundle['androidx.credentials.provider.extra.CREDENTIAL_REQUEST_ORIGIN']
    : undefined

  return normalizeDcApiOrigin(typeof request.origin === 'string' ? request.origin : sourceBundleOrigin)
}

export function getDcApiRequestContext(request: DigitalCredentialsRequest) {
  const dcRequest = request as RuntimeDigitalCredentialsRequest
  const requestIndex = dcRequest.selection?.requestIdx ?? dcRequest.selectedEntry?.providerIndex ?? 0
  const requestPayload = getDcApiRequestPayload(dcRequest)

  if (!isRecord(requestPayload)) {
    throw new Error('Invalid Digital Credentials API request payload')
  }

  const requestEntries =
    'requests' in requestPayload && Array.isArray(requestPayload.requests)
      ? requestPayload.requests
      : 'providers' in requestPayload && Array.isArray(requestPayload.providers)
        ? requestPayload.providers
        : undefined
  const requestEntry = Array.isArray(requestEntries) ? requestEntries[requestIndex] : undefined

  if (!isRecord(requestEntry)) {
    throw new Error('Missing provider request for Digital Credentials API request')
  }

  const { protocol } = requestEntry
  const providerRequest = requestEntry.data ?? requestEntry.request
  const selectedCredentials =
    dcRequest.selection?.creds
      ?.map((credential): DcApiSelectedCredential | undefined => {
        if (typeof credential.entryId !== 'string' || credential.entryId.length === 0) return undefined
        return {
          credentialRecordId: credential.entryId,
          inputDescriptorId:
            typeof credential.metadata?.credential_id === 'string' && credential.metadata.credential_id.length > 0
              ? credential.metadata.credential_id
              : typeof credential.metadata?.dcql_id === 'string' && credential.metadata.dcql_id.length > 0
                ? credential.metadata.dcql_id
                : undefined,
        }
      })
      .filter((credential): credential is DcApiSelectedCredential => credential !== undefined) ??
    (typeof dcRequest.selectedEntry?.credentialId === 'string' && dcRequest.selectedEntry.credentialId.length > 0
      ? [{ credentialRecordId: dcRequest.selectedEntry.credentialId }]
      : [])

  if (typeof protocol !== 'string' || protocol.length === 0) {
    throw new Error('Missing Digital Credentials API protocol in request')
  }

  if (!providerRequest) {
    throw new Error('Missing provider request for Digital Credentials API request')
  }

  if (selectedCredentials.length === 0) {
    throw new Error('Missing selected credential for Digital Credentials API request')
  }

  return {
    origin: getDcApiOrigin(dcRequest),
    protocol,
    providerRequest,
    selectedCredentials,
  }
}

export async function dcApiResolveRequest({ paradym, request }: DcApiResolveRequestOptions) {
  const { origin, providerRequest, selectedCredentials } = getDcApiRequestContext(request)
  const authorizationRequestPayload =
    typeof providerRequest === 'string' ? parseJsonObject(providerRequest) : providerRequest

  if (!isRecord(authorizationRequestPayload)) {
    throw new Error('Invalid Digital Credentials API request payload')
  }

  // TODO: should allow limiting it to a specific credential (as we already know the credential id)
  const result = await resolveCredentialRequest({
    paradym,
    requestPayload: authorizationRequestPayload,
    origin,
  })

  paradym.logger.debug('Resolved request', {
    result,
  })

  for (const selectedCredential of selectedCredentials) {
    const entry = selectedCredential.inputDescriptorId
      ? result.formattedSubmission.entries.find(
          (entry) => entry.inputDescriptorId === selectedCredential.inputDescriptorId
        )
      : result.formattedSubmission.entries.find(
          (entry) =>
            entry.isSatisfied &&
            entry.credentials.some(
              (credential) => credential.credential.record.id === selectedCredential.credentialRecordId
            )
        )

    if (!entry?.isSatisfied) {
      throw new Error(`Could not find selected entry for credential '${selectedCredential.credentialRecordId}'`)
    }

    const credential = entry.credentials.find(
      (credential) => credential.credential.record.id === selectedCredential.credentialRecordId
    )
    if (!credential) {
      throw new Error(
        `Could not find selected credential with id '${selectedCredential.credentialRecordId}' in formatted submission`
      )
    }

    entry.credentials = [credential]
  }

  return {
    ...result,
    verifier: {
      ...result.verifier,
      hostName: origin ? getHostNameFromUrl(origin) : undefined,
    },
  }
}
