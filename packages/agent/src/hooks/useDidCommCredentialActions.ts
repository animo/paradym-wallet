import { W3cCredentialRepository } from '@credo-ts/core'
import type { DidCommCredentialStateChangedEvent } from '@credo-ts/didcomm'
import { DidCommCredentialEventTypes, DidCommCredentialState } from '@credo-ts/didcomm'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { useMutation, useQuery } from '@tanstack/react-query'
import { firstValueFrom } from 'rxjs'
import { filter, first, timeout } from 'rxjs/operators'
import { useAgent } from '../agent'
import {
  getDidCommCredentialExchangeDisplayMetadata,
  openIdCredentialMetadataFromDidCommCredentialExchangeMetadata,
} from '../didcomm/metadata'
import { setOpenId4VcCredentialMetadata } from '../openid4vc/displayMetadata'
import { useCredentialById } from '../providers'

function useOfferAttributes(credentialExchangeId: string) {
  const { agent } = useAgent()

  const { data, status } = useQuery({
    queryKey: ['didCommCredentialOfferAttributes', credentialExchangeId],
    queryFn: async () => {
      const formatData = await agent.didcomm.credentials.getFormatData(credentialExchangeId)
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
        .observable<DidCommCredentialStateChangedEvent>(DidCommCredentialEventTypes.DidCommCredentialStateChanged)
        .pipe(
          // Correct record with id and state
          filter(
            (event) =>
              event.payload.credentialExchangeRecord.id === credentialExchangeId &&
              [DidCommCredentialState.CredentialReceived, DidCommCredentialState.Done].includes(
                event.payload.credentialExchangeRecord.state
              )
          ),
          // 10 seconds to complete exchange
          timeout(10000),
          first()
        )

      const credentialDonePromise = firstValueFrom(credentialDone$)

      await agent.didcomm.credentials.acceptOffer({ credentialExchangeRecordId: credentialExchangeId })
      const doneEvent = await credentialDonePromise

      const w3cCredentialRecordId = doneEvent.payload.credentialExchangeRecord.credentials.find(
        (c) => c.credentialRecordType === 'w3c'
      )?.credentialRecordId
      const didCommDisplayMetadata = getDidCommCredentialExchangeDisplayMetadata(
        doneEvent.payload.credentialExchangeRecord
      )

      // Update the w3c credential record metadata, based on the didcomm credential exchange display metadata
      if (w3cCredentialRecordId && didCommDisplayMetadata) {
        // NOTE: we store the metadata also in openid4vc format, just because it's simple. In the future
        // we may want to have our own display format we use for all credential types
        const w3cRecord = await agent.w3cCredentials.getById(w3cCredentialRecordId)

        // TODO: we must somehow link the w3c credential record to a DIDComm connection
        // first in Paradym Wallet, but would alos be nice to do this within Credo
        setOpenId4VcCredentialMetadata(
          w3cRecord,
          openIdCredentialMetadataFromDidCommCredentialExchangeMetadata(
            doneEvent.payload.credentialExchangeRecord,
            didCommDisplayMetadata
          )
        )

        const w3cCredentialRepository = agent.dependencyManager.resolve(W3cCredentialRepository)
        await w3cCredentialRepository.update(agent.context, w3cRecord)

        return w3cRecord
      }
    },
  })
  const { t } = useLingui()

  const { mutateAsync: declineCredentialMutation, status: declineStatus } = useMutation({
    mutationKey: ['declineDidCommCredential', credentialExchangeId],
    mutationFn: async () => {
      const credentialDone$ = agent.events
        .observable<DidCommCredentialStateChangedEvent>(DidCommCredentialEventTypes.DidCommCredentialStateChanged)
        .pipe(
          // Correct record with id and state
          filter(
            (event) =>
              event.payload.credentialExchangeRecord.id === credentialExchangeId &&
              event.payload.credentialExchangeRecord.state === DidCommCredentialState.Declined
          ),
          // 10 seconds to complete exchange
          timeout(10000),
          first()
        )

      const credentialDonePromise = firstValueFrom(credentialDone$)

      await agent.didcomm.credentials.declineOffer({
        credentialExchangeRecordId: credentialExchangeId,
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
        name: didcommDisplayMetadata?.issuerName ?? t(commonMessages.unknown),
        logo: {
          url: didcommDisplayMetadata?.issuerLogoUri,
        },
      },
      name: didcommDisplayMetadata?.credentialName ?? t(commonMessages.credential),
    },
    attributes: data?.attributes,
  }
}
