import { DidCommCredentialState, DidCommProofState } from '@credo-ts/didcomm'
import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { useEffect, useMemo } from 'react'
import type { ParadymAppAgent } from '../agent'
import {
  getDidCommCredentialExchangeDisplayMetadata,
  getDidCommProofExchangeDisplayMetadata,
  setDidCommCredentialExchangeMetadata,
  setDidCommProofExchangeMetadata,
} from '../didcomm/metadata'
import { getCredentialDisplayWithDefaults, getOpenId4VcCredentialDisplay } from '../display'
import { extractOpenId4VcCredentialMetadata } from '../openid4vc/displayMetadata'
import { useConnections } from '../providers/ConnectionProvider'
import { useCredentialByState } from '../providers/CredentialExchangeProvider'
import { useProofByState } from '../providers/ProofExchangeProvider'
import { useDeferredCredentials } from '../storage'

const isDIDCommEnabled = useFeatureFlag('DIDCOMM')

export const useHasInboxNotifications = () => {
  // Deferred credentials
  const { deferredCredentials } = useDeferredCredentials()
  let hasInboxNotifications = deferredCredentials.length > 0
  let inboxNotificationsCount = deferredCredentials.length

  // DID Comm
  if (isDIDCommEnabled) {
    const credentialExchangeRecords = useCredentialByState([DidCommCredentialState.OfferReceived])
    const proofExchangeRecords = useProofByState([DidCommProofState.RequestReceived])

    hasInboxNotifications ||= credentialExchangeRecords?.length > 0 || proofExchangeRecords.length > 0
    inboxNotificationsCount += (credentialExchangeRecords?.length ?? 0) + proofExchangeRecords.length
  }

  return {
    hasInboxNotifications,
    inboxNotificationsCount,
  }
}

/**
 * This hooks listens to all the credential and proof exchange records in the inbox and
 * will fetch the needed metadata for the records and add it to the metadata.
 *
 * This can be used on the main app, so it's is automatically triggered whenever an item
 * is added to the inbox.
 */
export const usePreFetchInboxDisplayMetadata = ({ agent }: { agent: ParadymAppAgent }) => {
  const credentialExchangeRecords = useCredentialByState([DidCommCredentialState.OfferReceived])
  const proofExchangeRecords = useProofByState([DidCommProofState.RequestReceived])
  const { records: connections } = useConnections()
  // Fetch associated metadata for each record
  useEffect(() => {
    credentialExchangeRecords.map(async (record) => {
      const metadata = getDidCommCredentialExchangeDisplayMetadata(record)
      if (metadata) return

      const connection = record.connectionId
        ? connections.find((connection) => record.connectionId === connection.id)
        : undefined

      // Extract label from out-of-band invitation if no connection associated
      const outOfBandRecord =
        !connection && record.parentThreadId
          ? await agent.modules.outOfBand.findByReceivedInvitationId(record.parentThreadId)
          : undefined

      const formatData = await agent.modules.credentials.getFormatData(record.id)
      const offer = formatData.offer?.anoncreds ?? formatData.offer?.indy
      // We just return here, so the rest can still continue
      if (!offer) return

      const schemaId = offer.schema_id

      const issuerName = connection?.theirLabel ?? outOfBandRecord?.outOfBandInvitation.label
      const schemaResult = await agent.modules.anoncreds.getSchema(schemaId)
      const schemaName = schemaResult.schema?.name

      // Update the metadata on the record for future use
      if (issuerName || schemaName) {
        setDidCommCredentialExchangeMetadata(record, {
          issuerName,
          issuerLogoUri: connection?.imageUrl ?? outOfBandRecord?.outOfBandInvitation.imageUrl,
          credentialName: schemaName,
        })
        await agent.modules.credentials.update(record)
      }
    })
  }, [credentialExchangeRecords, agent, connections])

  // Fetch associated metadata for each record
  useEffect(() => {
    proofExchangeRecords.map(async (record) => {
      const metadata = getDidCommProofExchangeDisplayMetadata(record)
      if (metadata) return

      const connection = record.connectionId
        ? connections.find((connection) => record.connectionId === connection.id)
        : undefined

      // Extract label from out-of-band invitation if no connection associated
      const outOfBandRecord =
        !connection && record.parentThreadId
          ? await agent.modules.outOfBand.findByReceivedInvitationId(record.parentThreadId)
          : undefined

      const formatData = await agent.modules.proofs.getFormatData(record.id)
      const request = formatData.request?.anoncreds ?? formatData.request?.indy

      // We just return here, so the rest can still continue
      if (!request) return

      const verifierName = connection?.theirLabel ?? outOfBandRecord?.outOfBandInvitation.label
      const proofName = request.name

      // Update the metadata on the record for future use
      if (verifierName || proofName) {
        setDidCommProofExchangeMetadata(record, {
          proofName,
          verifierLogoUri: connection?.imageUrl ?? outOfBandRecord?.outOfBandInvitation.imageUrl,
          verifierName,
        })
        await agent.modules.proofs.update(record)
      }
    })
  }, [proofExchangeRecords, agent, connections])
}

export const useInboxNotifications = () => {
  const credentialExchangeRecords = isDIDCommEnabled ? useCredentialByState([DidCommCredentialState.OfferReceived]) : []
  const proofExchangeRecords = isDIDCommEnabled ? useProofByState([DidCommProofState.RequestReceived]) : []
  const { deferredCredentials } = useDeferredCredentials()

  const { t } = useLingui()
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
          notificationTitle: metadata?.credentialName ?? t(commonMessages.credential),
        } as const
      }

      const metadata = getDidCommProofExchangeDisplayMetadata(record)

      return {
        id: record.id,
        type: record.type,
        createdAt: record.createdAt,
        contactLabel: metadata?.verifierName,
        notificationTitle: metadata?.proofName ?? t(commonMessages.dataRequest),
      } as const
    })
  }, [proofExchangeRecords, credentialExchangeRecords, deferredCredentials, t])

  return sortedNotifications
}
