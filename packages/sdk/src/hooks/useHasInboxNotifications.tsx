import { CredentialState, ProofState } from '@credo-ts/didcomm'
import { useCredentialByState } from '../providers/CredentialExchangeProvider'
import { useProofByState } from '../providers/ProofExchangeProvider'

export const useHasInboxNotifications = () => {
  const credentialExchangeRecords = useCredentialByState([CredentialState.OfferReceived])
  const proofExchangeRecords = useProofByState([ProofState.RequestReceived])

  return {
    hasInboxNotifications: credentialExchangeRecords.length > 0 || proofExchangeRecords.length > 0,
    inboxNotificationsCount: credentialExchangeRecords.length + proofExchangeRecords.length,
  }
}
