import type { CredentialStateChangedEvent } from '@credo-ts/core'

import { W3cCredentialRepository, CredentialState, CredentialEventTypes } from '@credo-ts/core'
import { useCredentialById } from '@credo-ts/react-hooks'
import { useMutation, useQuery } from '@tanstack/react-query'
import { firstValueFrom } from 'rxjs'
import { filter, first, timeout } from 'rxjs/operators'

import { useAgent } from '../agent'
import { getDidCommCredentialExchangeDisplayMetadata } from '../didcomm/metadata'
import { setOpenId4VcCredentialMetadata } from '../openid4vc/metadata'

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

export function useDidCommCredentialActions(credentialExchangeId: string) {
  const { agent } = useAgent()

  const credentialExchange = useCredentialById(credentialExchangeId)
  const { data } = useOfferAttributes(credentialExchangeId)

  const { mutateAsync: acceptCredentialMutation, status: acceptStatus } = useMutation({
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
      const doneEvent = await credentialDonePromise
      const w3cCredentialRecordId = doneEvent.payload.credentialRecord.credentials.find(
        (c) => c.credentialRecordType === 'w3c'
      )?.credentialRecordId

      // Update the w3c credential record metadata, based on the didcomm credential exchange display
      // metadata
      if (w3cCredentialRecordId) {
        const didCommDisplayMetadata = getDidCommCredentialExchangeDisplayMetadata(
          doneEvent.payload.credentialRecord
        )
        // NOTE: we store the metadata also in openid4vc format, just because it's simple. In the future
        // we may want to have our own display format we use for all credential types
        const w3cRecord = await agent.w3cCredentials.getCredentialRecordById(w3cCredentialRecordId)

        // TODO: we must somehow link the w3c credential record to a DIDComm connection
        // first in Paradym Wallet, but would alos be nice to do this within Credo
        setOpenId4VcCredentialMetadata(w3cRecord, {
          credential: {
            display: [
              {
                name: didCommDisplayMetadata?.credentialName ?? 'Credential',
              },
            ],
          },
          issuer: {
            id: didCommDisplayMetadata?.issuerName ?? 'Unkown',
            display: [
              {
                name: didCommDisplayMetadata?.issuerName,
              },
            ],
          },
        })

        const w3cCredentialRepository = agent.dependencyManager.resolve(W3cCredentialRepository)
        await w3cCredentialRepository.update(agent.context, w3cRecord)
      }
    },
  })

  const { mutateAsync: declineCredentialMutation, status: declineStatus } = useMutation({
    mutationKey: ['declineDidCommCredential', credentialExchangeId],
    mutationFn: async () => {
      const credentialDone$ = agent.events
        .observable<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged)
        .pipe(
          // Correct record with id and state
          filter(
            (event) =>
              event.payload.credentialRecord.id === credentialExchangeId &&
              event.payload.credentialRecord.state === CredentialState.Declined
          ),
          // 10 seconds to complete exchange
          timeout(10000),
          first()
        )

      const credentialDonePromise = firstValueFrom(credentialDone$)

      await agent.credentials.declineOffer(credentialExchangeId, {
        sendProblemReport: true,
      })
      await credentialDonePromise
    },
  })

  const didcommDisplayMetadata = credentialExchange
    ? getDidCommCredentialExchangeDisplayMetadata(credentialExchange)
    : undefined

  return {
    acceptCredential: acceptCredentialMutation,
    declineCredential: declineCredentialMutation,
    acceptStatus,
    declineStatus,
    credentialExchange,
    display: {
      issuer: {
        name: didcommDisplayMetadata?.issuerName ?? 'Unknown',
      },
      name: didcommDisplayMetadata?.credentialName ?? 'Credential',
    },
    attributes: data?.attributes,
  }
}
