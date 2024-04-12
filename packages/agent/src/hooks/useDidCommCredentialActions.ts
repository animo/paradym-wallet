import type { CredentialStateChangedEvent } from '@credo-ts/core'

import { CredentialState, CredentialEventTypes } from '@credo-ts/core'
import { useCredentialById } from '@credo-ts/react-hooks'
import { useMutation, useQuery } from '@tanstack/react-query'
import { firstValueFrom } from 'rxjs'
import { filter, first, timeout } from 'rxjs/operators'

import { useAgent } from '../agent'
import { getDidCommCredentialExchangeDisplayMetadata } from '../didcomm/metadata'

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
      await credentialDonePromise
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
