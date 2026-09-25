import { Hasher, TypedArrayEncoder } from '@credo-ts/core'
import type { FormattedSubmissionEntrySatisfied } from '../format/submission'
import { getPaymentsMetadata } from '../metadata/credentials'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { pasoLocalePriorityList } from '../paso/locale'
import {
  type FormattedTransactionDataPasoPayment,
  hasPasoTransactionData,
  resolvePasoTransactionData,
} from '../paso/transactionData'
import type { CredentialsForProofRequest } from './func/resolveCredentialRequest'

export type QtspInfo = CredentialsForProofRequest['verifier']

export type FormattedTransactionDataPaymentSingle = {
  type: 'urn:eudi:sca:eu.europa.ec:payment:single:1'
  amount: string
  dateTime: string
  payee: {
    name: string
    logo: string
    id: string
    website: string
  }
  cardForTransactionId?: string
  // base64url encoded hash used for fetching the status
  hash: string
}

export type FormattedTransactionDataQesAuthorization = {
  type: 'qes_authorization'
  documentName: string
  qtsp: QtspInfo
  cardForTransactionId?: string
}

export type FormattedTransactionData =
  | FormattedTransactionDataPaymentSingle
  | FormattedTransactionDataQesAuthorization
  | FormattedTransactionDataPasoPayment

/**
 * The transaction a request asks the user to authorize, whichever specification defines it.
 *
 * PaSO needs network access — verifying the signed credential metadata and resolving the payee logo
 * before consent is asked for — so this is async, while the TS 12 and QES paths stay synchronous
 * underneath.
 */
export const resolveTransactionData = async (
  paradym: ParadymWalletSdk,
  credentialsForRequest?: CredentialsForProofRequest,
  locale?: string
): Promise<FormattedTransactionData | undefined> => {
  if (!credentialsForRequest) return undefined

  if (hasPasoTransactionData(credentialsForRequest)) {
    return resolvePasoTransactionData(paradym, credentialsForRequest, pasoLocalePriorityList(locale))
  }

  return getFormattedTransactionData(credentialsForRequest, locale)
}

/**
 * The synchronous part: the TS 12 and QES transactions, which need nothing from the network.
 *
 * Returns `undefined` for a PaSO request rather than throwing. PaSO resolution is asynchronous, so a
 * caller that only has this function cannot describe a PaSO transaction — but it should still be
 * able to *finish*, and the caller that matters here is declining. Throwing left a user unable to
 * decline a payment the wallet had just shown them.
 */
export const getFormattedTransactionData = (
  credentialsForRequest?: CredentialsForProofRequest,
  _locale?: string
): FormattedTransactionData | undefined => {
  if (!credentialsForRequest) return undefined

  const transactionData = credentialsForRequest.transactionData

  if (!transactionData || transactionData.length === 0) return undefined
  if (hasPasoTransactionData(credentialsForRequest)) return undefined

  // Only allow one transaction data entry
  if (transactionData.length > 1) throw new Error('Multiple transactions are not supported yet.')

  const transactionDataEntry = transactionData[0]

  // TODO: this needs to be updated when we support credential selection
  const cardForTransactionId = transactionDataEntry.matchedCredentialIds.find((id) =>
    credentialsForRequest.formattedSubmission.entries.find((a) => a.inputDescriptorId === id)
  )

  if (transactionDataEntry.entry.transactionData.type === 'urn:eudi:sca:eu.europa.ec:payment:single:1') {
    const credential = credentialsForRequest.formattedSubmission.entries.find(
      (entry) => entry.inputDescriptorId === cardForTransactionId && entry.isSatisfied
    ) as FormattedSubmissionEntrySatisfied | undefined
    if (!credential) {
      throw new Error(`Transaction data requested a payment, but no required SCA credential was found in the wallet`)
    }

    const paymentMetadata = getPaymentsMetadata(credential.credentials[0].credential.record)
    if (!paymentMetadata) {
      throw new Error(`Could not find the payment metadata for ${credential.inputDescriptorId}`)
    }

    // TODO: `payee` does not seem to be in the object, needs to be added in the library
    // const matchedData = matchTransactionDataToTransactionDataType(
    //   [transactionDataEntry.entry.encoded],
    //   paymentMetadata,
    //   locale
    // )

    // const matchedDataForSinglePayment = matchedData['urn:eudi:sca:eu.europa.ec:payment:single:1']

    // const amount = matchedDataForSinglePayment.amount
    // const dateTime = matchedDataForSinglePayment.date_time

    const payload = transactionDataEntry.entry.transactionData.payload as Omit<
      FormattedTransactionDataPaymentSingle,
      'type' | 'cardForTransactionId'
    > & { date_time: string }

    return {
      type: transactionDataEntry.entry.transactionData.type,
      amount: payload.amount as string,
      dateTime: payload.date_time as string,
      payee: payload.payee as {
        name: string
        logo: string
        id: string
        website: string
      },
      cardForTransactionId,
      hash: TypedArrayEncoder.toBase64Url(
        Hasher.hash(TypedArrayEncoder.fromBase64Url(transactionDataEntry.entry.encoded), 'sha-256')
      ),
    }
  }

  // Only allow qes_authorization is supported at this time
  if (transactionDataEntry.entry.transactionData.type !== 'qes_authorization')
    throw new Error(
      'Only qes authorization and `urn:eudi:sca:eu.europa.ec:payment:single:1` are supported transactions'
    )

  return {
    type: transactionDataEntry.entry.transactionData.type,
    documentName: (transactionDataEntry.entry.transactionData.documentDigests as Array<{ label: string }>)[0].label,
    qtsp: credentialsForRequest.verifier, // Just use RP info for now
    cardForTransactionId,
  }
}
