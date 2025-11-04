import { addSharedActivityForCredentialsForRequest } from '@paradym/wallet-sdk/storage/activities'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import type { CredentialsForProofRequest } from '../getCredentialsForProofRequest'
import { getFormattedTransactionData } from '../transaction'

export type DeclineCredentialRequestOptions = {
  paradym: ParadymWalletSdk
  resolvedRequest: CredentialsForProofRequest
}

export const declineCredentialRequest = async ({ resolvedRequest, paradym }: DeclineCredentialRequestOptions) => {
  const formattedTransactionData = getFormattedTransactionData(resolvedRequest)
  await addSharedActivityForCredentialsForRequest(
    paradym,
    resolvedRequest,
    resolvedRequest.formattedSubmission.areAllSatisfied ? 'stopped' : 'failed',
    formattedTransactionData
  )
}
