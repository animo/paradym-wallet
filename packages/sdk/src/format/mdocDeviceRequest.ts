import type {
  MdocNameSpaces,
  MdocRecord,
  MdocResolvedDocRequest,
  MdocResolvedRequest,
  MdocSelectedCredentials,
} from '@credo-ts/core'
import type { ClaimsMatchResult } from '@owf/mdoc'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { formatAttributesWithRecordMetadata } from './attributes'
import type {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfiedCredential,
} from './submission'

/**
 * The elements a credential discloses for the claims it matched, per namespace.
 *
 * A requested element can be answered with an alternative set of elements (ISO/IEC TS 23220-4
 * 7.2.1.3.2), and an `age_over_NN` request with a different age attestation (18013-5 7.2.5), so the
 * claims are keyed by the elements disclosed. `alternatives` are the alternative sets chosen per
 * requested element, as `selectCredentialsForRequest` returns them. Without them the first option of
 * every claim is taken, the same as `selectCredentialsForRequest` takes.
 */
export const getDisclosedNameSpaces = (
  claims: ClaimsMatchResult,
  alternatives?: Record<string, Record<string, number>>
): MdocNameSpaces => {
  const nameSpaces: MdocNameSpaces = {}

  for (const claim of claims.validClaims) {
    const option = alternatives
      ? claim.options?.find(
          ({ alternativeElementSetIndex }) =>
            alternativeElementSetIndex === alternatives[claim.namespace]?.[claim.elementIdentifier]
        )
      : claim.options?.[0]
    const elements = option?.elements ?? [
      {
        namespace: claim.namespace,
        elementIdentifier: claim.disclosedElementIdentifier,
        elementValue: claim.elementValue,
      },
    ]

    for (const { namespace, elementIdentifier, elementValue } of elements) {
      nameSpaces[namespace] ??= {}
      nameSpaces[namespace][elementIdentifier] = elementValue
    }
  }

  return nameSpaces
}

/**
 * The elements a selected credential discloses, across the doc requests it answers.
 */
export const getDisclosedNameSpacesForSelectedCredential = (
  resolvedRequest: MdocResolvedRequest,
  credential: MdocSelectedCredentials['credentials'][number]
): MdocNameSpaces => {
  const nameSpaces: MdocNameSpaces = {}

  // Not `asArray`, which reads doc request index 0 as no index at all
  const docRequestIndexes =
    typeof credential.docRequestIndex === 'number' ? [credential.docRequestIndex] : credential.docRequestIndex

  for (const docRequestIndex of docRequestIndexes) {
    const match = resolvedRequest.docRequests
      .find((docRequest) => docRequest.docRequestIndex === docRequestIndex)
      ?.validCredentials.find(({ record }) => record.id === credential.record.id)
    if (!match) throw new Error(`The selected card does not answer doc request ${docRequestIndex}`)

    for (const [namespace, elements] of Object.entries(getDisclosedNameSpaces(match.claims, credential.alternatives))) {
      nameSpaces[namespace] = { ...nameSpaces[namespace], ...elements }
    }
  }

  return nameSpaces
}

const toSatisfiedCredential = (
  record: MdocRecord,
  disclosedClaims: MdocNameSpaces
): FormattedSubmissionEntrySatisfiedCredential => {
  const { metadata } = getAttributesAndMetadataForMdocPayload(disclosedClaims, record.firstCredential)

  return {
    credential: getCredentialForDisplay(record),
    disclosed: {
      attributes: formatAttributesWithRecordMetadata(disclosedClaims, record),
      rawAttributes: disclosedClaims as FormattedSubmissionEntrySatisfiedCredential['disclosed']['rawAttributes'],
      metadata,
      paths: Object.entries(disclosedClaims).flatMap(([namespace, elements]) =>
        Object.keys(elements).map((element) => [namespace, element])
      ),
    },
  }
}

const toSubmissionEntry = (docRequest: MdocResolvedDocRequest): FormattedSubmissionEntry => {
  const [firstValid] = docRequest.validCredentials

  if (firstValid) {
    return {
      inputDescriptorId: docRequest.docType,
      isSatisfied: true,
      credentials: [toSatisfiedCredential(firstValid.record, getDisclosedNameSpaces(firstValid.claims))],
    }
  }

  return {
    inputDescriptorId: docRequest.docType,
    isSatisfied: false,
    name: docRequest.docType,
    // The element identifier only, the way every unsatisfied mdoc entry lists what it asks for.
    requestedAttributePaths: Object.values(docRequest.nameSpaces).flatMap((elements) =>
      Object.keys(elements).map((element) => [element])
    ),
    // An mdoc of the requested docType that lacks requested elements. Mdocs of another docType
    // are matched too, and fail on their docType: those are other cards, not partial matches.
    partialMatches: docRequest.failedCredentials
      .filter(({ docType, claims }) => docType.success && !claims.success)
      .map(({ record, claims }) => ({
        credential: getCredentialForDisplay(record),
        missingAttributePaths: claims.failedClaims
          .filter((claim) => !claim.optional)
          .map((claim) => [claim.elementIdentifier]),
        // A device request asks for elements, not for values
        mismatchedAttributePaths: [],
      })),
  }
}

/**
 * The doc requests to show for a request the wallet cannot answer: the document set that comes
 * closest, of the mandatory use case that cannot be answered, or of any use case when none is
 * mandatory. Closest is the most doc requests answered, then the most with a card that lacks
 * attributes, so a card missing attributes is shown before no card.
 */
const getClosestDocRequests = (resolvedRequest: MdocResolvedRequest): MdocResolvedDocRequest[] => {
  const failedMandatoryUseCase = resolvedRequest.useCases.find(({ mandatory, success }) => mandatory && !success)
  const documentSets = (failedMandatoryUseCase ? [failedMandatoryUseCase] : resolvedRequest.useCases).flatMap(
    ({ documentSets }) => documentSets
  )

  const toDocRequests = (documentSet: number[]) =>
    resolvedRequest.docRequests.filter(({ docRequestIndex }) => documentSet.includes(docRequestIndex))
  const closeness = (docRequests: MdocResolvedDocRequest[]) => [
    docRequests.filter(({ success }) => success).length,
    docRequests.filter(({ failedCredentials }) =>
      failedCredentials.some(({ docType, claims }) => docType.success && !claims.success)
    ).length,
  ]

  let closest = documentSets.length > 0 ? toDocRequests(documentSets[0]) : resolvedRequest.docRequests
  for (const documentSet of documentSets.slice(1)) {
    const docRequests = toDocRequests(documentSet)
    const [answered, partial] = closeness(docRequests)
    const [closestAnswered, closestPartial] = closeness(closest)
    if (answered > closestAnswered || (answered === closestAnswered && partial > closestPartial)) {
      closest = docRequests
    }
  }

  return closest
}

/**
 * What an mdoc device request asks for, in the same shape the app's share flow renders, for every
 * transport that carries one: proximity, and the digital credentials API on both platforms.
 *
 * When the wallet can answer the request, the submission holds one entry per document it answers
 * with: the credentials `selectCredentialsForRequest` selected, with the elements they disclose, so
 * what the user reviews is what is sent. A request can have use cases (18013-5 second edition 10.2.5)
 * that need several documents, and doc requests without use cases are alternatives, of which the
 * first the wallet can answer is.
 *
 * When it cannot, the submission holds the doc requests that come closest, see
 * {@link getClosestDocRequests}.
 */
export function getSubmissionForMdocRequest(
  resolvedRequest: MdocResolvedRequest,
  selectedCredentials: MdocSelectedCredentials | undefined
): FormattedSubmission {
  if (!resolvedRequest.success || !selectedCredentials) {
    return {
      areAllSatisfied: false,
      entries: getClosestDocRequests(resolvedRequest).map(toSubmissionEntry),
    }
  }

  return {
    areAllSatisfied: true,
    entries: selectedCredentials.credentials.map((credential) => ({
      inputDescriptorId: credential.record.firstCredential.docType,
      isSatisfied: true,
      credentials: [
        toSatisfiedCredential(
          credential.record,
          getDisclosedNameSpacesForSelectedCredential(resolvedRequest, credential)
        ),
      ],
    })),
  }
}
