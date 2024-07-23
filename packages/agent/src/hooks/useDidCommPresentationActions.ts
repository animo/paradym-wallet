import type {
  AnonCredsPredicateType,
  AnonCredsRequestedAttributeMatch,
  AnonCredsRequestedPredicate,
  AnonCredsRequestedPredicateMatch,
  AnonCredsSelectedCredentials,
} from '@credo-ts/anoncreds'
import type { ProofStateChangedEvent } from '@credo-ts/core'
import type { FormattedSubmission, FormattedSubmissionEntry } from '../format/formatPresentation'

import { CredentialRepository, CredoError, ProofEventTypes, ProofState } from '@credo-ts/core'
import { useConnectionById, useProofById } from '@credo-ts/react-hooks'
import { useMutation, useQuery } from '@tanstack/react-query'
import { firstValueFrom } from 'rxjs'
import { filter, first, timeout } from 'rxjs/operators'

import { useAgent } from '../agent'
import { getDidCommCredentialExchangeDisplayMetadata } from '../didcomm/metadata'

export function useDidCommPresentationActions(proofExchangeId: string) {
  const { agent } = useAgent()

  const proofExchange = useProofById(proofExchangeId)
  const connection = useConnectionById(proofExchange?.connectionId ?? '')

  const { data } = useQuery({
    queryKey: ['didCommPresentationSubmission', proofExchangeId],
    queryFn: async () => {
      const repository = agent.dependencyManager.resolve(CredentialRepository)
      const formatData = await agent.proofs.getFormatData(proofExchangeId)

      const proofRequest = formatData.request?.anoncreds ?? formatData.request?.indy

      const credentialsForRequest = await agent.proofs.getCredentialsForRequest({
        proofRecordId: proofExchangeId,
      })

      const formatKey = formatData.request?.anoncreds !== undefined ? 'anoncreds' : 'indy'
      const anonCredsCredentials =
        credentialsForRequest.proofFormats.anoncreds ?? credentialsForRequest.proofFormats.indy
      if (!anonCredsCredentials || !proofRequest) {
        throw new CredoError('Invalid proof request.')
      }

      const entries = new Map<
        string,
        {
          groupNames: {
            attributes: string[]
            predicates: string[]
          }
          matches: Array<AnonCredsRequestedPredicateMatch>
          requestedAttributes: Set<string>
        }
      >()

      const mergeOrSetEntry = (
        type: 'attribute' | 'predicate',
        groupName: string,
        requestedAttributeNames: string[],
        matches: AnonCredsRequestedAttributeMatch[] | AnonCredsRequestedPredicateMatch[]
      ) => {
        // We create an entry hash. This way we can group all items that have the same credentials
        // available. If no credentials are available for a group, we create a entry hash based
        // on the group name
        const entryHash = groupName.includes('__CREDENTIAL__')
          ? groupName.split('__CREDENTIAL__')[0]
          : matches.length > 0
            ? matches
                .map((a) => a.credentialId)
                .sort()
                .join(',')
            : groupName

        const entry = entries.get(entryHash)

        if (!entry) {
          entries.set(entryHash, {
            groupNames: {
              attributes: type === 'attribute' ? [groupName] : [],
              predicates: type === 'predicate' ? [groupName] : [],
            },
            matches,
            requestedAttributes: new Set(requestedAttributeNames),
          })
          return
        }

        if (type === 'attribute') {
          entry.groupNames.attributes.push(groupName)
        } else {
          entry.groupNames.predicates.push(groupName)
        }

        entry.requestedAttributes = new Set([...requestedAttributeNames, ...entry.requestedAttributes])

        // We only include the matches which are present in both entries. If we use the __CREDENTIAL__ it means we can only use
        // credentials that match both (we want this in Paradym). For the other ones we create a 'hash' from all available credentialIds
        // first already, so it should give the same result.
        entry.matches = entry.matches.filter((match) =>
          matches.some((innerMatch) => match.credentialId === innerMatch.credentialId)
        )
      }

      const allCredentialIds = [
        ...Object.values(anonCredsCredentials.attributes).flatMap((matches) =>
          matches.map((match) => match.credentialId)
        ),
        ...Object.values(anonCredsCredentials.predicates).flatMap((matches) =>
          matches.map((match) => match.credentialId)
        ),
      ]
      const credentialExchanges = await repository.findByQuery(agent.context, {
        $or: allCredentialIds.map((credentialId) => ({ credentialIds: [credentialId] })),
      })

      for (const [groupName, attributeArray] of Object.entries(anonCredsCredentials.attributes)) {
        const requestedAttribute = proofRequest.requested_attributes[groupName]
        if (!requestedAttribute) throw new Error('Invalid presentation request')
        const requestedAttributesNames = requestedAttribute.names ?? [requestedAttribute.name as string]

        mergeOrSetEntry('attribute', groupName, requestedAttributesNames, attributeArray)
      }

      for (const [groupName, predicateArray] of Object.entries(anonCredsCredentials.predicates)) {
        const requestedPredicate = proofRequest.requested_predicates[groupName]
        if (!requestedPredicate) throw new Error('Invalid presentation request')

        mergeOrSetEntry('predicate', groupName, [formatPredicate(requestedPredicate)], predicateArray)
      }

      const entriesArray = Array.from(entries.entries()).map(([entryHash, entry]): FormattedSubmissionEntry => {
        return {
          inputDescriptorId: entryHash,
          credentials: entry.matches.map((match) => {
            const credentialExchange = credentialExchanges.find((c) =>
              c.credentials.find((cc) => cc.credentialRecordId === match.credentialId)
            )
            const credentialDisplayMetadata = credentialExchange
              ? getDidCommCredentialExchangeDisplayMetadata(credentialExchange)
              : undefined

            return {
              id: match.credentialId,
              credentialName: credentialDisplayMetadata?.credentialName ?? 'Credential',
              isSatisfied: true,
              issuerName: credentialDisplayMetadata?.issuerName ?? 'Unknown',
              requestedAttributes: Array.from(entry.requestedAttributes),
            }
          }),
          isSatisfied: entry.matches.length > 0,
          // TODO: we can fetch the schema name based on requirements
          name: 'Credential',
        }
      })

      const submission: FormattedSubmission = {
        areAllSatisfied: entriesArray.every((entry) => entry.isSatisfied),
        entries: entriesArray,
        name: proofRequest?.name ?? 'Unknown',
      }

      return { submission, formatKey, entries }
    },
  })

  const { mutateAsync: acceptMutateAsync, status: acceptStatus } = useMutation({
    mutationKey: ['acceptDidCommPresentation', proofExchangeId],
    mutationFn: async (selectedCredentials?: { [inputDescriptorId: string]: string }) => {
      let formatInput: { indy?: AnonCredsSelectedCredentials; anoncreds?: AnonCredsSelectedCredentials } | undefined =
        undefined

      if (selectedCredentials && Object.keys(selectedCredentials).length > 0) {
        if (!data?.formatKey || !data.entries) throw new Error('Unable to accept presentation without credentials')

        const selectedAttributes: Record<string, AnonCredsRequestedAttributeMatch> = {}
        const selectedPredicates: Record<string, AnonCredsRequestedPredicateMatch> = {}

        for (const [inputDescriptorId, entry] of Array.from(data.entries.entries())) {
          const credentialId = selectedCredentials[inputDescriptorId]
          const match = entry.matches.find((match) => match.credentialId === credentialId) ?? entry.matches[0]

          for (const groupName of entry.groupNames.attributes) {
            selectedAttributes[groupName] = {
              ...match,
              revealed: true,
            }
          }

          for (const groupName of entry.groupNames.predicates) {
            selectedPredicates[groupName] = match
          }
        }

        formatInput = {
          [data.formatKey]: {
            attributes: selectedAttributes,
            predicates: selectedPredicates,
            selfAttestedAttributes: {},
          },
        }
      }

      const presentationDone$ = agent.events.observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged).pipe(
        // Correct record with id and state
        filter(
          (event) =>
            event.payload.proofRecord.id === proofExchangeId &&
            [ProofState.PresentationSent, ProofState.Done].includes(event.payload.proofRecord.state)
        ),
        // 10 seconds to complete exchange
        timeout(10000),
        first()
      )

      const presentationDonePromise = firstValueFrom(presentationDone$)
      await agent.proofs.acceptRequest({
        proofRecordId: proofExchangeId,
        proofFormats: formatInput,
      })
      await presentationDonePromise
    },
  })

  const { mutateAsync: declineMutateAsync, status: declineStatus } = useMutation({
    mutationKey: ['declineDidCommPresentation', proofExchangeId],
    mutationFn: async () => {
      const presentationDeclined$ = agent.events
        .observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged)
        .pipe(
          // Correct record with id and state
          filter(
            (event) =>
              event.payload.proofRecord.id === proofExchangeId &&
              [ProofState.Declined].includes(event.payload.proofRecord.state)
          ),
          // 10 seconds to complete exchange
          timeout(10000),
          first()
        )

      const presentationDeclinePromise = firstValueFrom(presentationDeclined$)
      await agent.proofs.declineRequest({ proofRecordId: proofExchangeId, sendProblemReport: true })
      await presentationDeclinePromise
    },
  })

  return {
    acceptPresentation: acceptMutateAsync,
    declinePresentation: declineMutateAsync,
    acceptStatus,
    declineStatus,
    proofExchange,
    submission: data?.submission,
    verifierName: connection?.theirLabel,
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
  return `${requestedPredicate.name} ${predicateTypeMap[requestedPredicate.p_type]} ${requestedPredicate.p_value}`
}
