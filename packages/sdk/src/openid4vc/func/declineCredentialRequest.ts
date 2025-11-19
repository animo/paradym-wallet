import { storeSharedActivityForCredentialsForRequest } from '@paradym/wallet-sdk/storage/activityStore'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import type { CredentialsForProofRequest } from '../getCredentialsForProofRequest'
import { getFormattedTransactionData } from '../transaction'

export type DeclineCredentialRequestOptions = {
  paradym: ParadymWalletSdk
  resolvedRequest: CredentialsForProofRequest
}

export const declineCredentialRequest = async ({ resolvedRequest, paradym }: DeclineCredentialRequestOptions) => {
  const formattedTransactionData = getFormattedTransactionData(resolvedRequest)
  await storeSharedActivityForCredentialsForRequest(
    paradym,
    resolvedRequest,
    resolvedRequest.formattedSubmission.areAllSatisfied ? 'stopped' : 'failed',
    formattedTransactionData
  )
}
