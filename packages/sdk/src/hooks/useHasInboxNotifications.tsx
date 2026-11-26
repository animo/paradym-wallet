import { DidCommCredentialState, DidCommProofState } from '@credo-ts/didcomm'
import { useCredentialByState } from '../providers/CredentialExchangeProvider'
import { useProofByState } from '../providers/ProofExchangeProvider'
import { useDeferredCredentials } from '../storage/deferredCredentialStore'

export const useHasInboxNotifications = () => {
  const credentialExchangeRecords = useCredentialByState([DidCommCredentialState.OfferReceived])
  const proofExchangeRecords = useProofByState([DidCommProofState.RequestReceived])
  // The inbox lists cards still waiting to be issued too, so they count here as well
  const { deferredCredentials } = useDeferredCredentials()
  const count = credentialExchangeRecords.length + proofExchangeRecords.length + deferredCredentials.length

  return {
    hasInboxNotifications: count > 0,
    inboxNotificationsCount: count,
  }
}
