import { CredentialState, ProofState } from '@credo-ts/didcomm'
import { useMemo } from 'react'
import {
  getDidCommCredentialExchangeDisplayMetadata,
  getDidCommProofExchangeDisplayMetadata,
} from '../metadata/credentials'
import { useCredentialByState } from '../providers/CredentialExchangeProvider'
import { useProofByState } from '../providers/ProofExchangeProvider'

export const useInboxNotifications = () => {
  const credentialExchangeRecords = useCredentialByState([CredentialState.OfferReceived])
  const proofExchangeRecords = useProofByState([ProofState.RequestReceived])

  const sortedNotifications = useMemo(() => {
    // Sort by creation date
    const sortedRecords = [...credentialExchangeRecords, ...proofExchangeRecords].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return sortedRecords.map((record) => {
      if (record.type === 'CredentialRecord') {
        const metadata = getDidCommCredentialExchangeDisplayMetadata(record)

        return {
          id: record.id,
          type: record.type,
          createdAt: record.createdAt,
          contactLabel: metadata?.issuerName,
          notificationTitle: metadata?.credentialName ?? 'Credential',
        } as const
      }
      const metadata = getDidCommProofExchangeDisplayMetadata(record)

      return {
        id: record.id,
        type: record.type,
        createdAt: record.createdAt,
        contactLabel: metadata?.verifierName,
        notificationTitle: metadata?.proofName ?? 'Data Request',
      } as const
    })
  }, [proofExchangeRecords, credentialExchangeRecords])

  return sortedNotifications
}
