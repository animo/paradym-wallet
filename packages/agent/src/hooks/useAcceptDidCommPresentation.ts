import type { FormattedSubmission } from '../format/formatPresentation'
import type {
  AnonCredsPredicateType,
  AnonCredsRequestedAttributeMatch,
  AnonCredsRequestedPredicate,
  AnonCredsRequestedPredicateMatch,
} from '@aries-framework/anoncreds'
import type { ProofStateChangedEvent } from '@aries-framework/core'

import {
  CredentialRepository,
  AriesFrameworkError,
  ProofEventTypes,
  ProofState,
} from '@aries-framework/core'
import { useConnectionById, useProofById } from '@aries-framework/react-hooks'
import { useMutation, useQuery } from '@tanstack/react-query'
import { firstValueFrom } from 'rxjs'
import { filter, first, timeout } from 'rxjs/operators'

import { useAgent } from '../agent'
import { getDidCommCredentialExchangeDisplayMetadata } from '../didcomm/metadata'

export function useAcceptDidCommPresentation(proofExchangeId: string) {
  const { agent } = useAgent()

  const proofExchange = useProofById(proofExchangeId)
  const connection = useConnectionById(proofExchange?.connectionId ?? '')

  const { data } = useQuery({
    queryKey: ['didCommPresentationSubmission', proofExchangeId],
    queryFn: async (): Promise<FormattedSubmission> => {
      const repository = agent.dependencyManager.resolve(CredentialRepository)
      const formatData = await agent.proofs.getFormatData(proofExchangeId)
      const proofRequest = formatData.request?.anoncreds ?? formatData.request?.indy

      const credentialsForRequest = await agent.proofs.getCredentialsForRequest({
        proofRecordId: proofExchangeId,
      })

      const anonCredsCredentials =
        credentialsForRequest.proofFormats.anoncreds ?? credentialsForRequest.proofFormats.indy

      if (!anonCredsCredentials || !proofRequest) {
        throw new AriesFrameworkError('Invalid proof request.')
      }

      const submission: FormattedSubmission = {
        areAllSatisfied: false,
        entries: [],
        name: proofRequest?.name ?? 'Unknown',
      }

      await Promise.all(
        Object.keys(anonCredsCredentials.attributes).map(async (groupName) => {
          const requestedAttribute = proofRequest.requested_attributes[groupName]
          const attributeNames = requestedAttribute?.names ?? [requestedAttribute?.name as string]
          const attributeArray = anonCredsCredentials.attributes[
            groupName
          ] as AnonCredsRequestedAttributeMatch[]

          const firstMatch = attributeArray[0]

          if (!firstMatch) {
            submission.entries.push({
              credentialName: 'Credential', // TODO: we can extract this from the schema name, but we would have to fetch it
              isSatisfied: false,
              name: groupName, // TODO
              requestedAttributes: attributeNames,
            })
          } else {
            const credentialExchange = await repository.findSingleByQuery(agent.context, {
              credentialIds: [firstMatch.credentialId],
            })

            const credentialDisplayMetadata = credentialExchange
              ? getDidCommCredentialExchangeDisplayMetadata(credentialExchange)
              : undefined

            submission.entries.push({
              name: groupName, // TODO: humanize string? Or should we let this out?
              credentialName: credentialDisplayMetadata?.credentialName ?? 'Credential',
              isSatisfied: true,
              issuerName: credentialDisplayMetadata?.issuerName ?? 'Unknown',
              requestedAttributes: attributeNames,
            })
          }
        })
      )

      await Promise.all(
        Object.keys(anonCredsCredentials.predicates).map(async (groupName) => {
          const requestedPredicate = proofRequest.requested_predicates[groupName]
          const predicateArray = anonCredsCredentials.predicates[
            groupName
          ] as AnonCredsRequestedPredicateMatch[]

          if (!requestedPredicate) {
            throw new Error('Invalid presentation request')
          }

          // FIXME: we need to still filter based on the predicate (e.g. age is actually >= 18)
          // This should probably be fixed in AFJ.
          const firstMatch = predicateArray[0]

          if (!firstMatch) {
            submission.entries.push({
              credentialName: 'Credential', // TODO: we can extract this from the schema name, but we would have to fetch it
              isSatisfied: false,
              name: groupName, // TODO
              requestedAttributes: [formatPredicate(requestedPredicate)],
            })
          } else {
            const credentialExchange = await repository.findSingleByQuery(agent.context, {
              credentialIds: [firstMatch.credentialId],
            })

            const credentialDisplayMetadata = credentialExchange
              ? getDidCommCredentialExchangeDisplayMetadata(credentialExchange)
              : undefined

            submission.entries.push({
              name: groupName, // TODO: humanize string? Or should we let this out?
              credentialName: credentialDisplayMetadata?.credentialName ?? 'Credential',
              isSatisfied: true,
              issuerName: credentialDisplayMetadata?.issuerName ?? 'Unknown',
              requestedAttributes: [formatPredicate(requestedPredicate)],
            })
          }
        })
      )

      submission.areAllSatisfied = submission.entries.every((entry) => entry.isSatisfied)

      return submission
    },
  })

  const { mutateAsync, status } = useMutation({
    mutationKey: ['acceptDidCommPresentation', proofExchangeId],
    mutationFn: async () => {
      const presentationDone$ = agent.events
        .observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged)
        .pipe(
          // Correct record with id and state
          filter(
            (event) =>
              event.payload.proofRecord.id === proofExchangeId &&
              [ProofState.PresentationSent, ProofState.Done].includes(
                event.payload.proofRecord.state
              )
          ),
          // 10 seconds to complete exchange
          timeout(10000),
          first()
        )

      const presentationDonePromise = firstValueFrom(presentationDone$)

      await agent.proofs.acceptRequest({ proofRecordId: proofExchangeId })
      await presentationDonePromise
    },
  })

  return {
    acceptPresentation: mutateAsync,
    status,
    proofExchange,
    submission: data,
    verifierName: connection?.theirLabel ?? 'Unknown',
  }
}

const predicateTypeMap: Record<AnonCredsPredicateType, string> = {
  '>': 'greater than',
  '>=': 'greater than', // or equal to
  '<': 'less than',
  '<=': 'less than', // or equal to
}

/**
 * Format requested predicate into string
 * @example `age greater than 18`
 *
 * @todo we could improve on this rendering, by e.g. recognizing dates in predicates (e.g. 20200101)
 */
function formatPredicate(requestedPredicate: AnonCredsRequestedPredicate) {
  return `${requestedPredicate.name} ${predicateTypeMap[requestedPredicate.p_type]} ${
    requestedPredicate.p_value
  }`
}
