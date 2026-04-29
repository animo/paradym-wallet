import type { DigitalCredentialsRequest } from '@animo-id/expo-digital-credentials-api'
import { getAptitudeSelection } from '@animo-id/expo-digital-credentials-api-aptitude-consortium'
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
  }
  selectedEntry?: {
    credentialId?: string
    providerIndex?: number
  }
  sourceBundle?: unknown
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

function credentialMatchesId(credential: { credential: { id: string; record: { id: string } } }, credentialId: string) {
  return credential.credential.id === credentialId || credential.credential.record.id === credentialId
}

export function getDcApiRequestContext(request: DigitalCredentialsRequest) {
  const dcRequest = request as RuntimeDigitalCredentialsRequest
  const aptitudeSelection = getAptitudeSelection(request)
  const requestIndex = aptitudeSelection?.requestIdx ?? dcRequest.selection?.requestIdx ?? dcRequest.selectedEntry?.providerIndex ?? 0
  const requestPayload = getDcApiRequestPayload(dcRequest)

  if (!isRecord(requestPayload)) {
    throw new Error('Invalid Digital Credentials API request payload')
  }

  const requestEntries = Array.isArray(requestPayload.requests) ? requestPayload.requests : requestPayload.providers
  const requestEntry = Array.isArray(requestEntries) ? requestEntries[requestIndex] : undefined

  if (!isRecord(requestEntry)) {
    throw new Error('Missing provider request for Digital Credentials API request')
  }

  const { protocol } = requestEntry
  const providerRequest = requestEntry.data ?? requestEntry.request
  const selectedCredentialId = dcRequest.selectedEntry?.credentialId

  if (typeof protocol !== 'string' || protocol.length === 0) {
    throw new Error('Missing Digital Credentials API protocol in request')
  }

  if (!providerRequest) {
    throw new Error('Missing provider request for Digital Credentials API request')
  }

  if (!aptitudeSelection && (typeof selectedCredentialId !== 'string' || selectedCredentialId.length === 0)) {
    throw new Error('Missing selected credential for Digital Credentials API request')
  }

  return {
    origin: getDcApiOrigin(dcRequest),
    protocol,
    providerRequest,
    selectedCredentialId,
  }
}

export async function dcApiResolveRequest({ paradym, request }: DcApiResolveRequestOptions) {
  const { origin, providerRequest, selectedCredentialId } = getDcApiRequestContext(request)
  const authorizationRequestPayload =
    typeof providerRequest === 'string' ? parseJsonObject(providerRequest) : providerRequest

  if (!isRecord(authorizationRequestPayload)) {
    throw new Error('Invalid Digital Credentials API request payload')
  }

  const result = await resolveCredentialRequest({
    paradym,
    requestPayload: authorizationRequestPayload,
    origin,
  })

  paradym.logger.debug('Resolved request', {
    result,
  })

  if (selectedCredentialId) {
    const [entry] = result.formattedSubmission.entries
    if (result.formattedSubmission.entries.length !== 1) {
      throw new Error('Only requests for a single credential supported for digital credentials api')
    }

    if (entry.isSatisfied) {
      const credential = entry.credentials.find((candidate) => credentialMatchesId(candidate, selectedCredentialId))
      if (!credential) {
        throw new Error(`Could not find selected credential with id '${selectedCredentialId}' in formatted submission`)
      }

      entry.credentials = [credential]
    }
  }

  return {
    ...result,
    verifier: {
      ...result.verifier,
      hostName: origin ? getHostNameFromUrl(origin) : undefined,
    },
  }
}
