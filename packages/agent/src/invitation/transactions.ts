import type { CredentialsForProofRequest } from './handler'

export type FormattedTransactionData = ReturnType<typeof getFormattedTransactionData>
export type QtspInfo = CredentialsForProofRequest['verifier']

export const getFormattedTransactionData = (credentialsForRequest?: CredentialsForProofRequest) => {
  if (!credentialsForRequest) return undefined

  const transactionData = credentialsForRequest.transactionData

  if (!transactionData || transactionData.length === 0) return undefined

  // Only allow one transaction data entry
  if (transactionData.length > 1) throw new Error('Multiple transactions are not supported yet.')

  const transactionDataEntry = transactionData[0]

  // Only allow qes_authorization is supported at this time
  if (transactionDataEntry.entry.transactionData.type !== 'qes_authorization')
    throw new Error('Only document signing is supported at this time.')

  // TODO: this needs to be updated when we support credential signing
  const cardForSigningId = credentialsForRequest.formattedSubmission.entries.find(
    (a) => a.isSatisfied
  )?.inputDescriptorId
  if (!cardForSigningId) {
    throw new Error('Could not determine credential id for signing of qes_authorization.')
  }

  return {
    type: transactionDataEntry.entry.transactionData.type as 'qes_authorization',
    documentName: (transactionDataEntry.entry.transactionData.documentDigests as Array<{ label: string }>)[0].label,
    qtsp: credentialsForRequest.verifier, // Just use RP info for now
    cardForSigningId,
  }
}
