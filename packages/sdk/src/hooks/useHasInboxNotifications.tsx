import { DidCommCredentialState, DidCommProofState } from '@credo-ts/didcomm'
import { useCredentialByState } from '../providers/CredentialExchangeProvider'
import { useProofByState } from '../providers/ProofExchangeProvider'

export const useHasInboxNotifications = () => {
  const credentialExchangeRecords = useCredentialByState([DidCommCredentialState.OfferReceived])
  const proofExchangeRecords = useProofByState([DidCommProofState.RequestReceived])

  return {
    hasInboxNotifications: credentialExchangeRecords.length > 0 || proofExchangeRecords.length > 0,
    inboxNotificationsCount: credentialExchangeRecords.length + proofExchangeRecords.length,
  }
}
