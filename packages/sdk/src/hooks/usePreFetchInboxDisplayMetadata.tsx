import { DidCommCredentialState, DidCommProofState } from '@credo-ts/didcomm'
import { useEffect } from 'react'
import { assertAgentType } from '../agent'
import {
  getDidCommCredentialExchangeDisplayMetadata,
  getDidCommProofExchangeDisplayMetadata,
  setDidCommCredentialExchangeMetadata,
  setDidCommProofExchangeMetadata,
} from '../metadata/credentials'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { useConnections } from '../providers/ConnectionProvider'
import { useCredentialByState } from '../providers/CredentialExchangeProvider'
import { useProofByState } from '../providers/ProofExchangeProvider'

/**
 * This hooks listens to all the credential and proof exchange records in the inbox and
 * will fetch the needed metadata for the records and add it to the metadata.
 *
 * This can be used on the main app, so it's is automatically triggered whenever an item
 * is added to the inbox.
 */
export const usePreFetchInboxDisplayMetadata = ({ paradym }: { paradym: ParadymWalletSdk }) => {
  const credentialExchangeRecords = useCredentialByState([DidCommCredentialState.OfferReceived])
  const proofExchangeRecords = useProofByState([DidCommProofState.RequestReceived])
  const { records: connections } = useConnections()

  const agent = paradym.agent
  assertAgentType(agent, 'didcomm')

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
          ? await agent.didcomm.oob.findByReceivedInvitationId(record.parentThreadId)
          : undefined

      const formatData = await agent.didcomm.credentials.getFormatData(record.id)
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
        await agent.didcomm.credentials.update(record)
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
          ? await agent.didcomm.oob.findByReceivedInvitationId(record.parentThreadId)
          : undefined

      const formatData = await agent.didcomm.proofs.getFormatData(record.id)
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
        await agent.didcomm.proofs.update(record)
      }
    })
  }, [proofExchangeRecords, agent, connections])
}
