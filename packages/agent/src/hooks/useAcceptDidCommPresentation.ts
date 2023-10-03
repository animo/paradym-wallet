import type { FormattedSubmission } from '../format/formatPresentation'
import type {
  AnonCredsCredentialsForProofRequest,
  AnonCredsPredicateType,
  AnonCredsRequestedAttributeMatch,
  AnonCredsRequestedPredicate,
  AnonCredsRequestedPredicateMatch,
  AnonCredsSelectedCredentials,
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
import { useState } from 'react'
import { firstValueFrom } from 'rxjs'
import { filter, first, timeout } from 'rxjs/operators'

import { useAgent } from '../agent'
import { getDidCommCredentialExchangeDisplayMetadata } from '../didcomm/metadata'

export function useAcceptDidCommPresentation(proofExchangeId: string) {
  const { agent } = useAgent()

  const proofExchange = useProofById(proofExchangeId)
  const connection = useConnectionById(proofExchange?.connectionId ?? '')
  const [submissionEntryIndexes, setSubmissionEntryIndexes] = useState<number[]>()

  const { data } = useQuery({
    queryKey: ['didCommPresentationSubmission', proofExchangeId],
    queryFn: async (): Promise<{
      anonCredsCredentials: AnonCredsCredentialsForProofRequest
      submission: FormattedSubmission
      format: 'anoncreds' | 'indy'
    }> => {
      const repository = agent.dependencyManager.resolve(CredentialRepository)
      const formatData = await agent.proofs.getFormatData(proofExchangeId)
      const format = formatData.request?.anoncreds ? 'anoncreds' : 'indy'
      const proofRequest = formatData.request?.[format]

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
              credentials: [],
              isSatisfied: false,
              name: groupName,
            })
          } else {
            const credentials = await Promise.all(
              attributeArray.map(async (attributeMatch) => {
                // TODO: we can probably optimize this. We already have all records in memory
                // We can also make it a single query instead of multiple
                const credentialExchange = await repository.findSingleByQuery(agent.context, {
                  credentialIds: [attributeMatch.credentialId],
                })

                const credentialDisplayMetadata = credentialExchange
                  ? getDidCommCredentialExchangeDisplayMetadata(credentialExchange)
                  : undefined

                return {
                  requestedAttributes: attributeNames,
                  credentialName: credentialDisplayMetadata?.credentialName ?? 'Credential',
                  issuerName: credentialDisplayMetadata?.issuerName ?? 'Unknown',
                }
              })
            )

            submission.entries.push({
              name: groupName, // TODO: humanize string? Or should we let this out?
              isSatisfied: true,
              credentials,
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
              credentials: [],
              isSatisfied: false,
              name: groupName, // TODO
            })
          } else {
            const credentials = await Promise.all(
              predicateArray.map(async (predicateMatch) => {
                const credentialExchange = await repository.findSingleByQuery(agent.context, {
                  credentialIds: [predicateMatch.credentialId],
                })

                const credentialDisplayMetadata = credentialExchange
                  ? getDidCommCredentialExchangeDisplayMetadata(credentialExchange)
                  : undefined

                return {
                  issuerName: credentialDisplayMetadata?.issuerName ?? 'Unknown',
                  credentialName: credentialDisplayMetadata?.credentialName ?? 'Credential',
                  requestedAttributes: [formatPredicate(requestedPredicate)],
                }
              })
            )

            submission.entries.push({
              name: groupName, // TODO: humanize string? Or should we let this out?
              isSatisfied: true,
              credentials,
            })
          }
        })
      )

      submission.areAllSatisfied = submission.entries.every((entry) => entry.isSatisfied)

      // Set all entries to first one by default (or -1 if not satisfied)
      setSubmissionEntryIndexes(
        submission.entries.map((submissionEntry) => (submissionEntry.isSatisfied ? 0 : -1))
      )

      return { submission, anonCredsCredentials, format }
    },
  })

  const { mutateAsync, status } = useMutation({
    mutationKey: ['acceptDidCommPresentation', proofExchangeId],
    mutationFn: async () => {
      if (!data || !submissionEntryIndexes) throw new Error('No credentials available')

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

      const selectedCredentials: AnonCredsSelectedCredentials = {
        attributes: {},
        predicates: {},
        selfAttestedAttributes: {},
      }

      submissionEntryIndexes.forEach((credentialIndex, submissionEntryIndex) => {
        const submissionEntry = data.submission.entries[submissionEntryIndex]
        if (!submissionEntry) throw new Error('Submission entry does not exist')
        if (!submissionEntry.isSatisfied) throw new Error('Submission entry is not satisfied')
        const selectedCredential = submissionEntry.credentials[credentialIndex]
        if (!selectedCredential) throw new Error('Selected credential does not exist')
        const type = data.anonCredsCredentials.attributes[submissionEntry.name]
          ? 'attributes'
          : 'predicates'
        const anonCredsCredentials = data.anonCredsCredentials[type][submissionEntry.name]
        if (!anonCredsCredentials) throw new Error('Credential does not exist')
        const anonCredsCredential = anonCredsCredentials[credentialIndex]
        if (!anonCredsCredential) throw new Error('Credential does not exist')

        selectedCredentials[type][submissionEntry.name] = anonCredsCredential
      })

      await agent.proofs.acceptRequest({
        proofRecordId: proofExchangeId,
        proofFormats: {
          [data.format]: selectedCredentials,
        },
      })
      await presentationDonePromise
    },
  })

  function setCredentialIndexForSubmissionEntryIndex(
    credentialIndex: number,
    submissionEntryIndex: number
  ) {
    setSubmissionEntryIndexes((prev) => {
      if (!prev) return prev
      const newIndexes = [...prev]
      newIndexes[submissionEntryIndex] = credentialIndex
      return newIndexes
    })
  }

  return {
    acceptPresentation: mutateAsync,
    status,
    proofExchange,
    submission: data?.submission,
    verifierName: connection?.theirLabel,
    setCredentialIndexForSubmissionEntryIndex,
    submissionEntryIndexes,
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
