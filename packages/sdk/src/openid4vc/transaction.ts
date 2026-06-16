import { Hasher, TypedArrayEncoder } from '@credo-ts/core'
import type { FormattedSubmissionEntrySatisfied } from '../format/submission'
import { getPaymentsMetadata } from '../metadata/credentials'
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
  // hex encoded hash used for fetching the status
  hash: string
}

export type FormattedTransactionDataQesAuthorization = {
  type: 'qes_authorization'
  documentName: string
  qtsp: QtspInfo
  cardForTransactionId?: string
}

export type FormattedTransactionData = FormattedTransactionDataPaymentSingle | FormattedTransactionDataQesAuthorization

export const getFormattedTransactionData = (
  credentialsForRequest?: CredentialsForProofRequest,
  _locale?: string
): FormattedTransactionData | undefined => {
  if (!credentialsForRequest) return undefined

  const transactionData = credentialsForRequest.transactionData

  if (!transactionData || transactionData.length === 0) return undefined

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
      hash: TypedArrayEncoder.toHex(
        Hasher.hash(TypedArrayEncoder.fromBase64(transactionDataEntry.entry.encoded), 'sha-256')
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
