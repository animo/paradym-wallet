import { DidCommCredentialState, DidCommProofState } from '@credo-ts/didcomm'
import { useCredentialByState } from '../providers/CredentialExchangeProvider'
import { useProofByState } from '../providers/ProofExchangeProvider'
import { useParadym } from './useParadym'

export const useHasInboxNotifications = () => {
  const { paradym } = useParadym('unlocked')

  const credentialExchangeRecords = paradym.isDidCommEnabled
    ? useCredentialByState([DidCommCredentialState.OfferReceived])
    : []
  const proofExchangeRecords = paradym.isDidCommEnabled ? useProofByState([DidCommProofState.RequestReceived]) : []

  return {
    hasInboxNotifications: credentialExchangeRecords.length > 0 || proofExchangeRecords.length > 0,
    inboxNotificationsCount: credentialExchangeRecords.length + proofExchangeRecords.length,
  }
}
