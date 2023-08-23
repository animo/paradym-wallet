import type { CredentialExchangeRecord, CredentialStateChangedEvent } from '@aries-framework/core'

import { CredentialState, CredentialEventTypes } from '@aries-framework/core'
import { useConnectionById, useCredentialById } from '@aries-framework/react-hooks'
import { useMutation, useQuery } from '@tanstack/react-query'
import { firstValueFrom } from 'rxjs'
import { filter, first, timeout } from 'rxjs/operators'

import { useAgent } from '../agent'
import {
  getDidCommCredentialExchangeDisplayMetadata,
  setDidCommCredentialExchangeMetadata,
} from '../didcomm/metadata'

function useOfferAttributes(credentialExchangeId: string) {
  const { agent } = useAgent()

  const { data, status } = useQuery({
    queryKey: ['didCommCredentialOfferAttributes', credentialExchangeId],
    queryFn: async () => {
      const formatData = await agent.credentials.getFormatData(credentialExchangeId)
      const offer = formatData.offer?.anoncreds ?? formatData.offer?.indy
      const offerAttributes = formatData.offerAttributes

      if (!offer || !offerAttributes) {
        throw new Error('Invalid credential offer')
      }

      return {
        attributes: Object.fromEntries(offerAttributes.map(({ name, value }) => [name, value])),
        schemaId: offer.schema_id,
      }
    },
  })

  return {
    data,
    status,
  }
}

function useDidCommCredentialDisplayMetadata(
  credentialExchangeRecord?: CredentialExchangeRecord,
  schemaId?: string
) {
  const { agent } = useAgent()

  // TODO: we should also fetch the oob record for a label for connectionless exchanges
  const connectionRecord = useConnectionById(credentialExchangeRecord?.connectionId ?? '')

  const { data, status } = useQuery({
    enabled: credentialExchangeRecord !== undefined && schemaId !== undefined,
    queryKey: ['didCommCredentialDisplayMetadata', credentialExchangeRecord?.id, schemaId],
    queryFn: async () => {
      if (!credentialExchangeRecord || !schemaId) return undefined
      const metadata = getDidCommCredentialExchangeDisplayMetadata(credentialExchangeRecord)
      if (metadata) {
        return metadata
      }

      const issuerName = connectionRecord?.theirLabel
      const schemaResult = await agent.modules.anoncreds.getSchema(schemaId)
      const schemaName = schemaResult.schema?.name

      // Update the metadata on the record for future use
      if (issuerName || schemaName) {
        setDidCommCredentialExchangeMetadata(credentialExchangeRecord, {
          issuerName,
          credentialName: schemaName,
        })
        await agent.credentials.update(credentialExchangeRecord)
      }

      return {
        issuerName: connectionRecord?.theirLabel,
        credentialName: schemaName,
      }
    },
  })

  return {
    display: data,
    status,
  }
}

export function useAcceptDidCommCredential(credentialExchangeId: string) {
  const { agent } = useAgent()

  const credentialExchange = useCredentialById(credentialExchangeId)
  const { data } = useOfferAttributes(credentialExchangeId)
  const { display: didcommDisplayMetadata, status: displayMetadataStatus } =
    useDidCommCredentialDisplayMetadata(credentialExchange, data?.schemaId)

  const { mutateAsync, status } = useMutation({
    mutationKey: ['acceptDidCommCredential', credentialExchangeId],
    mutationFn: async () => {
      const credentialDone$ = agent.events
        .observable<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged)
        .pipe(
          // Correct record with id and state
          filter(
            (event) =>
              event.payload.credentialRecord.id === credentialExchangeId &&
              [CredentialState.CredentialReceived, CredentialState.Done].includes(
                event.payload.credentialRecord.state
              )
          ),
          // 10 seconds to complete exchange
          timeout(10000),
          first()
        )

      const credentialDonePromise = firstValueFrom(credentialDone$)

      await agent.credentials.acceptOffer({ credentialRecordId: credentialExchangeId })
      await credentialDonePromise
    },
  })

  return {
    acceptCredential: mutateAsync,
    status,
    credentialExchange,
    display:
      displayMetadataStatus === 'loading'
        ? undefined
        : {
            issuer: {
              name: didcommDisplayMetadata?.issuerName ?? 'Unknown',
            },
            name: didcommDisplayMetadata?.credentialName ?? 'Credential',
          },
    attributes: data?.attributes,
  }
}
