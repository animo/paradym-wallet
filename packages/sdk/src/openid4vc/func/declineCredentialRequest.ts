import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { storeSharedActivityForCredentialsForRequest } from '../../storage/activityStore'
import type { CredentialsForProofRequest } from '../func/resolveCredentialRequest'
import { type FormattedTransactionData, getFormattedTransactionData } from '../transaction'

export type DeclineCredentialRequestOptions = {
  paradym: ParadymWalletSdk
  resolvedRequest: CredentialsForProofRequest
  /**
   * The transaction the user was shown, where the caller already resolved one.
   *
   * Worth passing for a PaSO request: resolving one is asynchronous, so the synchronous fallback
   * below cannot describe it and the declined activity would be recorded without its transaction.
   */
  transactionData?: FormattedTransactionData
}

export const declineCredentialRequest = async ({
  resolvedRequest,
  paradym,
  transactionData,
}: DeclineCredentialRequestOptions) => {
  await storeSharedActivityForCredentialsForRequest(
    paradym,
    resolvedRequest,
    resolvedRequest.formattedSubmission.areAllSatisfied ? 'stopped' : 'failed',
    transactionData ?? getFormattedTransactionData(resolvedRequest)
  )
}
