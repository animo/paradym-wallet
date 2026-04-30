import type { ResolvedWalletCredential, TransactionDataInput } from '@animo-id/eudi-wallet-ts12-dcql'
import { Hasher, type JsonObject, TypedArrayEncoder } from '@credo-ts/core'
import type { OpenId4VpAcceptAuthorizationRequestOptions } from '@credo-ts/openid4vc'
import type { FormattedSubmission, FormattedSubmissionTransactionData } from '../format/submission'
import {
  EUDI_PAYMENT_TRANSACTION_DATA_TYPES,
  isEudiPaymentCredentialVct,
  isEudiPaymentTransactionDataType,
} from './eudiPaymentTransactionData'
import type { CredentialsForProofRequest } from './func/resolveCredentialRequest'

export const FUNKE_QES_AUTHORIZATION_TRANSACTION_DATA_TYPE = 'qes_authorization'

type MatchedTransactionData = NonNullable<CredentialsForProofRequest['transactionData']>[number]
export type FormattedTransactionData = ReturnType<typeof getFormattedTransactionData>
export type OpenId4VpTransactionDataForConsent =
  | FormattedSubmissionTransactionData
  | NonNullable<FormattedTransactionData>
export type QtspInfo = CredentialsForProofRequest['verifier']
export type OpenId4VpTransactionDataResponse = OpenId4VpAcceptAuthorizationRequestOptions['transactionData']
type OpenId4VpTransactionDataResponseEntry = NonNullable<OpenId4VpTransactionDataResponse>[number]
type HashAlgorithm = 'sha-1' | 'sha-256'
type TransactionDataCredential = {
  vcts?: Iterable<string>
}

export type OpenId4VpTransactionDataType = {
  credentialSupportsTransactionData?: (credential: TransactionDataCredential) => boolean
  getCredentialWhitelist: (transactionData: MatchedTransactionData) => string[]
  createResponseEntry: (
    transactionData: MatchedTransactionData,
    context: {
      selectedCredentials: Record<string, string>
      hasCredentialForInputDescriptor: (inputDescriptorId: string) => boolean
    }
  ) => OpenId4VpTransactionDataResponseEntry | undefined
}

type FormattedTransactionDataFormatter = (
  transactionData: NonNullable<ResolvedWalletCredential['transactionData']>
) => FormattedSubmissionTransactionData

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function getTransactionDataType(transactionData: MatchedTransactionData) {
  return getOpenId4VpTransactionDataType(transactionData.entry.transactionData.type)
}

function formatResolvedTransactionDataValue(value: unknown): string {
  if (value && typeof value === 'object' && 'value' in value) {
    return formatResolvedTransactionDataValue(value.value)
  }

  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === undefined || value === null) return ''

  return JSON.stringify(value)
}

function formatOptionalResolvedTransactionDataValue(value: unknown) {
  const formatted = formatResolvedTransactionDataValue(value)
  return formatted.length > 0 ? formatted : undefined
}

function getResolvedUiLabel(
  resolved: NonNullable<ResolvedWalletCredential['transactionData']>['resolved'],
  id: string
) {
  return formatOptionalResolvedTransactionDataValue(resolved?.ui_labels?.[id]?.value)
}

function formatPaymentAmount(amount: unknown, currency: unknown) {
  const formattedAmount = formatOptionalResolvedTransactionDataValue(amount)
  const formattedCurrency = formatOptionalResolvedTransactionDataValue(currency)
  if (!formattedAmount || !formattedCurrency) return formattedAmount

  return formattedAmount.toLowerCase().includes(formattedCurrency.toLowerCase())
    ? formattedAmount
    : `${formattedCurrency} ${formattedAmount}`
}

function getFunkeQesDocumentName(transactionData: Record<string, unknown>) {
  const documentDigest = Array.isArray(transactionData.documentDigests)
    ? asRecord(transactionData.documentDigests[0])
    : undefined
  const label = documentDigest?.label

  return typeof label === 'string' ? label : undefined
}

function formatFunkeQesTransactionData(
  transactionData: NonNullable<ResolvedWalletCredential['transactionData']>
): FormattedSubmissionTransactionData {
  const entry = transactionData.entry as unknown as Record<string, unknown>
  const documentName = getFunkeQesDocumentName(entry)

  return {
    index: transactionData.index,
    type: transactionData.entry.type,
    title: documentName,
    claims: documentName
      ? []
      : Object.entries(entry).flatMap(([label, value]) =>
          label === 'type' || label === 'credential_ids'
            ? []
            : [
                {
                  label,
                  value: formatResolvedTransactionDataValue(value),
                },
              ]
        ),
  }
}

function formatEudiPaymentTransactionData(
  transactionData: NonNullable<ResolvedWalletCredential['transactionData']>
): FormattedSubmissionTransactionData {
  const payload = asRecord(transactionData.entry.payload) ?? {}
  const payee = asRecord(payload.payee)
  const amount = asRecord(payload.amount)
  const amountValue = amount?.value ?? amount?.amount ?? payload.amount

  return {
    index: transactionData.index,
    type: transactionData.entry.type,
    title: getResolvedUiLabel(transactionData.resolved, 'transaction_title'),
    securityHint: getResolvedUiLabel(transactionData.resolved, 'security_hint'),
    affirmativeActionLabel: getResolvedUiLabel(transactionData.resolved, 'affirmative_action_label'),
    denialActionLabel: getResolvedUiLabel(transactionData.resolved, 'denial_action_label'),
    payment: {
      amount: formatPaymentAmount(amountValue, amount?.currency ?? payload.currency),
      payeeName: formatOptionalResolvedTransactionDataValue(payee?.name),
      payeeId: formatOptionalResolvedTransactionDataValue(payee?.id),
      payeeLogo: formatOptionalResolvedTransactionDataValue(payee?.logo),
      transactionId: formatOptionalResolvedTransactionDataValue(payload.transaction_id),
    },
    claims:
      transactionData.resolved?.claims.map((claim) => ({
        label: formatResolvedTransactionDataValue(claim.label.value),
        value: formatResolvedTransactionDataValue(claim.value.value),
      })) ?? [],
  }
}

export const formattedTransactionDataFormatters: Record<string, FormattedTransactionDataFormatter> = {
  [FUNKE_QES_AUTHORIZATION_TRANSACTION_DATA_TYPE]: formatFunkeQesTransactionData,
  ...Object.fromEntries(EUDI_PAYMENT_TRANSACTION_DATA_TYPES.map((type) => [type, formatEudiPaymentTransactionData])),
}

export function getFormattedTransactionDataFormatter(type: string) {
  const formatter = formattedTransactionDataFormatters[type]
  if (!formatter) throw new Error(`Unsupported transaction data type '${type}'`)

  return formatter
}

export function formatResolvedTransactionData(
  transactionData: NonNullable<ResolvedWalletCredential['transactionData']>
): FormattedSubmissionTransactionData {
  return getFormattedTransactionDataFormatter(transactionData.entry.type)(transactionData)
}

function getFormattedSubmissionTransactionDataByIndex(submission: FormattedSubmission, indexes: number[]) {
  const requestedIndexes = new Set(indexes)
  const seenIndexes = new Set<number>()
  const transactionData: FormattedSubmissionTransactionData[] = []

  const addTransactionData = (entry?: FormattedSubmissionTransactionData) => {
    if (!entry || !requestedIndexes.has(entry.index) || seenIndexes.has(entry.index)) return

    seenIndexes.add(entry.index)
    transactionData.push(entry)
  }

  for (const credentialSet of submission.credentialSets ?? []) {
    for (const slot of credentialSet.slots) {
      for (const alternative of slot.alternatives) {
        addTransactionData(alternative.transactionData)
        Object.values(alternative.transactionDataByCredentialId ?? {}).forEach(addTransactionData)
      }
    }
  }

  return transactionData
}

function createCredentialBoundTransactionDataResponseEntry(
  transactionData: MatchedTransactionData,
  context: Parameters<OpenId4VpTransactionDataType['createResponseEntry']>[1]
) {
  const credentialWhitelist = getTransactionDataType(transactionData).getCredentialWhitelist(transactionData)
  const { selectedCredentials, hasCredentialForInputDescriptor } = context
  const credentialId =
    credentialWhitelist.find((id) => selectedCredentials[id] && transactionData.matchedCredentialIds.includes(id)) ??
    credentialWhitelist.find(
      (id) => hasCredentialForInputDescriptor(id) && transactionData.matchedCredentialIds.includes(id)
    )

  return credentialId ? { credentialId } : undefined
}

export const openId4VpTransactionDataTypes: Record<string, OpenId4VpTransactionDataType> = {
  [FUNKE_QES_AUTHORIZATION_TRANSACTION_DATA_TYPE]: {
    getCredentialWhitelist: (transactionData) => transactionData.entry.transactionData.credential_ids,
    createResponseEntry: createCredentialBoundTransactionDataResponseEntry,
  },
  ...Object.fromEntries(
    EUDI_PAYMENT_TRANSACTION_DATA_TYPES.map((type) => [
      type,
      {
        getCredentialWhitelist: (transactionData: MatchedTransactionData) =>
          transactionData.entry.transactionData.credential_ids,
        credentialSupportsTransactionData: ({ vcts }: TransactionDataCredential) => isEudiPaymentCredentialVct(vcts),
        createResponseEntry: createCredentialBoundTransactionDataResponseEntry,
      },
    ])
  ),
}

export function getOpenId4VpTransactionDataType(type: string) {
  const transactionDataType = openId4VpTransactionDataTypes[type]
  if (!transactionDataType) throw new Error(`Unsupported transaction data type '${type}'`)

  return transactionDataType
}

export function isCredentialQueryTargetedByTransactionData(
  credentialQueryId: string,
  transactionData: TransactionDataInput[]
) {
  return transactionData.some((entry) => entry.credential_ids.includes(credentialQueryId))
}

export function credentialSupportsTransactionData({
  credential,
  credentialQueryId,
  transactionData,
}: {
  credential: TransactionDataCredential
  credentialQueryId: string
  transactionData: TransactionDataInput[]
}) {
  const targetedTransactionData = transactionData.filter((entry) => entry.credential_ids.includes(credentialQueryId))
  if (targetedTransactionData.length === 0) return true

  return targetedTransactionData.some((entry) => {
    const transactionDataType = openId4VpTransactionDataTypes[entry.type]

    return transactionDataType?.credentialSupportsTransactionData?.(credential) === true
  })
}

export const getFormattedTransactionData = (credentialsForRequest?: CredentialsForProofRequest) => {
  if (!credentialsForRequest) return undefined

  const transactionData = credentialsForRequest.transactionData
  if (!transactionData || transactionData.length !== 1) return undefined

  const transactionDataEntry = transactionData[0]
  if (transactionDataEntry.entry.transactionData.type !== FUNKE_QES_AUTHORIZATION_TRANSACTION_DATA_TYPE) {
    return undefined
  }

  const transactionDataType = getTransactionDataType(transactionDataEntry)
  const credentialWhitelist = transactionDataType.getCredentialWhitelist(transactionDataEntry)
  const cardForSigningId = credentialWhitelist.find(
    (id) =>
      transactionDataEntry.matchedCredentialIds.includes(id) &&
      credentialsForRequest.formattedSubmission.entries.find((entry) => entry.inputDescriptorId === id)
  )

  return {
    type: transactionDataEntry.entry.transactionData.type,
    documentName: (transactionDataEntry.entry.transactionData.documentDigests as Array<{ label: string }>)[0].label,
    qtsp: credentialsForRequest.verifier,
    cardForSigningId,
  }
}

export function getOpenId4VpTransactionDataForConsent({
  resolvedRequest,
  displayedTransactionDataIndexes,
}: {
  resolvedRequest: CredentialsForProofRequest
  displayedTransactionDataIndexes: number[]
}): OpenId4VpTransactionDataForConsent[] {
  const requestedTransactionData = resolvedRequest.authorizationRequest.transaction_data
  if (requestedTransactionData === undefined || requestedTransactionData.length === 0) return []
  if (!resolvedRequest.transactionData || resolvedRequest.transactionData.length === 0) {
    throw new Error('No transaction data entries were resolved for the authorization request')
  }

  const displayedIndexes = new Set(displayedTransactionDataIndexes)
  const undisplayedTransactionDataIndexes = resolvedRequest.transactionData
    .filter((transactionData) => {
      getTransactionDataType(transactionData)

      return !displayedIndexes.has(transactionData.entry.transactionDataIndex)
    })
    .map((transactionData) => transactionData.entry.transactionDataIndex)

  if (undisplayedTransactionDataIndexes.length === 0) return []

  const formattedSubmissionTransactionData = getFormattedSubmissionTransactionDataByIndex(
    resolvedRequest.formattedSubmission,
    undisplayedTransactionDataIndexes
  )

  if (formattedSubmissionTransactionData.length === undisplayedTransactionDataIndexes.length) {
    return formattedSubmissionTransactionData
  }

  const formattedTransactionData = getFormattedTransactionData(resolvedRequest)
  if (undisplayedTransactionDataIndexes.length === 1 && formattedTransactionData) return [formattedTransactionData]

  throw new Error('Digital Credentials API transaction data was not displayed and could not be rendered.')
}

function getTransactionDataResponseEntry(
  transactionData: MatchedTransactionData,
  context: Parameters<OpenId4VpTransactionDataType['createResponseEntry']>[1]
) {
  const responseEntry = getTransactionDataType(transactionData).createResponseEntry(transactionData, context)

  if (!responseEntry) throw new Error('No credential selected for transaction data')

  return responseEntry
}

export function getOpenId4VpTransactionDataResponse({
  authorizationRequest,
  transactionData,
  selectedCredentials,
  hasCredentialForInputDescriptor,
}: {
  authorizationRequest: CredentialsForProofRequest['authorizationRequest']
  transactionData: CredentialsForProofRequest['transactionData']
  selectedCredentials: Record<string, string>
  hasCredentialForInputDescriptor: (inputDescriptorId: string) => boolean
}): OpenId4VpTransactionDataResponse {
  const transactionDataEntries = authorizationRequest.transaction_data
  if (transactionDataEntries === undefined) return undefined
  if (transactionDataEntries.length === 0) return []
  if (!transactionData || transactionData.length === 0) {
    throw new Error('No transaction data entries were resolved for the authorization request')
  }

  return transactionData.map((entry) =>
    getTransactionDataResponseEntry(entry, { selectedCredentials, hasCredentialForInputDescriptor })
  )
}

function getTransactionDataHashAlgorithm(transactionData: MatchedTransactionData): HashAlgorithm {
  const allowedHashAlgorithms = transactionData.entry.transactionData.transaction_data_hashes_alg ?? ['sha-256']
  const hashAlgorithm = (['sha-1', 'sha-256'] as const).find((algorithm) => allowedHashAlgorithms.includes(algorithm))

  if (!hashAlgorithm) {
    throw new Error(`No supported transaction data hash algorithm found. Supported algorithms are sha-1 and sha-256.`)
  }

  return hashAlgorithm
}

function createPaymentAdditionalPayload({
  authenticationMethods,
  createJti,
  responseMode,
  transactionData,
  authorizationRequestIntegrity,
  walletInstanceVersion,
  locale,
}: {
  authenticationMethods?: string[]
  createJti: () => string
  responseMode?: string
  transactionData: MatchedTransactionData
  authorizationRequestIntegrity?: string
  walletInstanceVersion?: string
  locale: string
}): JsonObject {
  if (!authenticationMethods || authenticationMethods.length === 0) {
    throw new Error('Payment transaction data requires authentication method references')
  }
  if (!authorizationRequestIntegrity) {
    throw new Error('Payment transaction data requires a signed authorization request integrity value')
  }
  if (!walletInstanceVersion) {
    throw new Error('Payment transaction data requires a wallet instance version')
  }

  const transactionDataHashAlgorithm = getTransactionDataHashAlgorithm(transactionData)

  return {
    jti: createJti(),
    response_mode: responseMode ?? 'direct_post',
    display_locale: locale,
    amr: authenticationMethods,
    transaction_data_hash: TypedArrayEncoder.toBase64URL(
      Hasher.hash(transactionData.entry.encoded, transactionDataHashAlgorithm)
    ),
    transaction_data_hash_alg: transactionDataHashAlgorithm,
    request_integrity: authorizationRequestIntegrity,
    wallet_instance_version: walletInstanceVersion,
  }
}

export function getOpenId4VpTransactionDataAdditionalPayloadByCredential({
  authenticationMethods,
  createJti,
  resolvedRequest,
  transactionDataResponse,
  walletInstanceVersion,
}: {
  authenticationMethods?: string[]
  createJti: () => string
  resolvedRequest: CredentialsForProofRequest
  transactionDataResponse: OpenId4VpTransactionDataResponse
  walletInstanceVersion?: string
}): Record<string, JsonObject> | undefined {
  if (!transactionDataResponse || transactionDataResponse.length === 0) return undefined
  if (!resolvedRequest.transactionData || resolvedRequest.transactionData.length === 0) return undefined

  const eudiDcql = 'eudiDcql' in resolvedRequest ? resolvedRequest.eudiDcql : undefined
  const locale = eudiDcql?.resolved.locale ?? 'en'
  const authorizationRequestIntegrity =
    'authorizationRequestIntegrity' in resolvedRequest ? resolvedRequest.authorizationRequestIntegrity : undefined
  const additionalPayloadByCredential: Record<string, JsonObject> = {}

  resolvedRequest.transactionData.forEach((transactionData, index) => {
    if (!isEudiPaymentTransactionDataType(transactionData.entry.transactionData.type)) return

    const responseEntry = transactionDataResponse[index]
    if (!responseEntry) throw new Error('No credential selected for payment transaction data')

    additionalPayloadByCredential[responseEntry.credentialId] = createPaymentAdditionalPayload({
      authenticationMethods,
      authorizationRequestIntegrity,
      createJti,
      locale,
      responseMode: resolvedRequest.authorizationRequest.response_mode,
      transactionData,
      walletInstanceVersion,
    })
  })

  return Object.keys(additionalPayloadByCredential).length > 0 ? additionalPayloadByCredential : undefined
}

export {
  EUDI_PAYMENT_TRANSACTION_DATA_TYPE,
  EUDI_PAYMENT_TRANSACTION_DATA_TYPES,
  EUDI_PAYMENTS_ANIMO_TRANSACTION_DATA_TYPE,
  eudiPaymentTransactionDataTypes,
} from './eudiPaymentTransactionData'
