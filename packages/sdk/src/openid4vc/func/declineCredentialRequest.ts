import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { storeSharedActivityForCredentialsForRequest } from '../../storage/activityStore'
import type { CredentialsForProofRequest } from '../func/resolveCredentialRequest'
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
