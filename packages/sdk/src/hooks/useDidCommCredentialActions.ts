import { W3cCredentialRepository } from '@credo-ts/core'
import type { CredentialStateChangedEvent } from '@credo-ts/didcomm'
import { CredentialEventTypes, CredentialState } from '@credo-ts/didcomm'
import { useMutation, useQuery } from '@tanstack/react-query'
import { firstValueFrom } from 'rxjs'
import { filter, first, timeout } from 'rxjs/operators'
import type { DidCommAgent } from '../agent'
import {
  getDidCommCredentialExchangeDisplayMetadata,
  openIdCredentialMetadataFromDidCommCredentialExchangeMetadata,
  setOpenId4VcCredentialMetadata,
} from '../metadata/credentials'
import { useAgent } from '../providers/AgentProvider'
import { useCredentialById } from '../providers/CredentialExchangeProvider'
import { addReceivedActivity } from '../storage/activities'

type AcceptCredentialOptions = {
  storeAsActivity?: boolean
}

type DeclineCredentialOptions = {
  deleteCredential?: boolean
}

function useOfferAttributes(credentialExchangeId: string) {
  const { agent } = useAgent<DidCommAgent>()

  const { data, status } = useQuery({
    queryKey: ['didCommCredentialOfferAttributes', credentialExchangeId],
    queryFn: async () => {
      const formatData = await agent.modules.credentials.getFormatData(credentialExchangeId)
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
  const { agent } = useAgent<DidCommAgent>()

  const credentialExchange = useCredentialById(credentialExchangeId)
  const { data } = useOfferAttributes(credentialExchangeId)

  const { mutateAsync: acceptCredentialMutation, status: acceptStatus } = useMutation({
    mutationKey: ['acceptDidCommCredential', credentialExchangeId],
    mutationFn: async (options: AcceptCredentialOptions = { storeAsActivity: true }) => {
      if (!credentialExchange) return

      const credentialDone$ = agent.events
        .observable<CredentialStateChangedEvent>(CredentialEventTypes.CredentialStateChanged)
        .pipe(
          // Correct record with id and state
          filter(
            (event) =>
              event.payload.credentialRecord.id === credentialExchangeId &&
              [CredentialState.CredentialReceived, CredentialState.Done].includes(event.payload.credentialRecord.state)
          ),
          // 10 seconds to complete exchange
          timeout(10000),
          first()
        )

      const credentialDonePromise = firstValueFrom(credentialDone$)

      await agent.modules.credentials.acceptOffer({ credentialRecordId: credentialExchangeId })
      const doneEvent = await credentialDonePromise

      const w3cCredentialRecordId = doneEvent.payload.credentialRecord.credentials.find(
        (c) => c.credentialRecordType === 'w3c'
      )?.credentialRecordId
      const didCommDisplayMetadata = getDidCommCredentialExchangeDisplayMetadata(doneEvent.payload.credentialRecord)

      // Update the w3c credential record metadata, based on the didcomm credential exchange display metadata
      if (w3cCredentialRecordId && didCommDisplayMetadata) {
        // NOTE: we store the metadata also in openid4vc format, just because it's simple. In the future
        // we may want to have our own display format we use for all credential types
        const w3cRecord = await agent.w3cCredentials.getCredentialRecordById(w3cCredentialRecordId)

        // TODO: we must somehow link the w3c credential record to a DIDComm connection
        // first in Paradym Wallet, but would alos be nice to do this within Credo
        setOpenId4VcCredentialMetadata(
          w3cRecord,
          openIdCredentialMetadataFromDidCommCredentialExchangeMetadata(
            doneEvent.payload.credentialRecord,
            didCommDisplayMetadata
          )
        )

        const w3cCredentialRepository = agent.dependencyManager.resolve(W3cCredentialRepository)
        await w3cCredentialRepository.update(agent.context, w3cRecord)

        if (options.storeAsActivity) {
          await addReceivedActivity(agent, {
            entityId: credentialExchange?.connectionId,
            name: didcommDisplayMetadata?.issuerName ?? 'Unknown',
            logo: { url: didcommDisplayMetadata?.issuerLogoUri },
            backgroundColor: '#ffffff', // Default to a white background for now
            credentialIds: [`w3c-credential-${w3cRecord?.id}`],
          })
        }

        return w3cRecord
      }
    },
  })

  const { mutateAsync: declineCredentialMutation, status: declineStatus } = useMutation({
    mutationKey: ['declineDidCommCredential', credentialExchangeId],
    mutationFn: async (options: DeclineCredentialOptions = { deleteCredential: true }) => {
      if (!credentialExchange) return

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

      await agent.modules.credentials.declineOffer(credentialExchangeId, {
        sendProblemReport: true,
      })

      if (options.deleteCredential) {
        await agent.modules.credentials.deleteById(credentialExchangeId)
      }

      await credentialDonePromise
    },
  })

  const didcommDisplayMetadata = credentialExchange
    ? getDidCommCredentialExchangeDisplayMetadata(credentialExchange)
    : undefined

  return {
    acceptCredential: (options?: AcceptCredentialOptions) => acceptCredentialMutation(options),
    declineCredential: (options?: DeclineCredentialOptions) => declineCredentialMutation(options),
    acceptStatus,
    declineStatus,
    credentialExchange,
    display: {
      issuer: {
        name: didcommDisplayMetadata?.issuerName ?? 'Unknown',
        logo: {
          url: didcommDisplayMetadata?.issuerLogoUri,
        },
      },
      name: didcommDisplayMetadata?.credentialName ?? 'Credential',
    },
    attributes: data?.attributes,
  }
}
