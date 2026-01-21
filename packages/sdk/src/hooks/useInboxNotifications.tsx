import { DidCommCredentialState, DidCommProofState } from '@credo-ts/didcomm'
import { useMemo } from 'react'
import { getCredentialDisplayWithDefaults } from '../display/common'
import { getOpenId4VcCredentialDisplay } from '../display/openid4vc'
import {
  extractOpenId4VcCredentialMetadata,
  getDidCommCredentialExchangeDisplayMetadata,
  getDidCommProofExchangeDisplayMetadata,
} from '../metadata/credentials'
import { useCredentialByState } from '../providers/CredentialExchangeProvider'
import { useProofByState } from '../providers/ProofExchangeProvider'
import { useDeferredCredentials } from '../storage/deferredCredentialStore'

export const useInboxNotifications = () => {
  const credentialExchangeRecords = useCredentialByState([DidCommCredentialState.OfferReceived])
  const proofExchangeRecords = useProofByState([DidCommProofState.RequestReceived])
  const { deferredCredentials } = useDeferredCredentials()

  const sortedNotifications = useMemo(() => {
    // Sort by creation date
    const sortedRecords = [
      ...credentialExchangeRecords,
      ...proofExchangeRecords,
      ...deferredCredentials.map((record) => ({
        type: 'DeferredCredentialRecord' as const,
        createdAt: new Date(record.createdAt),
        deferredCredentialRecord: record,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return sortedRecords.map((record) => {
      if (record.type === 'DeferredCredentialRecord') {
        const { response, issuerMetadata, id } = record.deferredCredentialRecord

        const credentialDisplay = getCredentialDisplayWithDefaults(
          getOpenId4VcCredentialDisplay(
            extractOpenId4VcCredentialMetadata(response.credentialConfiguration, {
              display: issuerMetadata.credentialIssuer?.display,
              id: issuerMetadata.credentialIssuer?.credential_issuer,
            })
          )
        )

        return {
          id: id,
          type: record.type,
          createdAt: record.createdAt,
          contactLabel: credentialDisplay.issuer.name,
          notificationTitle: credentialDisplay.name,
          backgroundColor: credentialDisplay.backgroundColor,
          backgroundImageUrl: credentialDisplay.backgroundImage?.url,
          deferredCredentialRecord: record.deferredCredentialRecord,
        }
      }

      if (record.type === 'CredentialRecord') {
        const metadata = getDidCommCredentialExchangeDisplayMetadata(record)

        return {
          id: record.id,
          type: record.type,
          createdAt: record.createdAt,
          contactLabel: metadata?.issuerName,
          notificationTitle: metadata?.credentialName,
        } as const
      }

      const metadata = getDidCommProofExchangeDisplayMetadata(record)

      return {
        id: record.id,
        type: record.type,
        createdAt: record.createdAt,
        contactLabel: metadata?.verifierName,
        notificationTitle: metadata?.proofName,
      } as const
    })
  }, [proofExchangeRecords, credentialExchangeRecords, deferredCredentials])

  return sortedNotifications
}
