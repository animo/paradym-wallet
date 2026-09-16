import type { MdocNameSpaces, MdocRecord } from '@credo-ts/core'
import type { ClaimsMatchResult } from '@owf/mdoc'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { formatAttributesWithRecordMetadata } from './attributes'
import {
  type FormattedSubmission,
  type FormattedSubmissionEntry,
  type FormattedSubmissionEntrySatisfiedCredential,
  selectAlternativeEntry,
} from './submission'

type MdocCredentialMatch = {
  record: MdocRecord
  docType: { success: boolean }
  claims: ClaimsMatchResult
}

/**
 * How the wallet's mdocs match one doc request of a device request, in the shape `@owf/mdoc`'s
 * `Holder.matchDeviceRequest` returns it — and Credo's `resolveDcApiRequest`, which is built on it —
 * with the stored record next to each credential.
 */
export type MdocDocRequestMatch = {
  docType: string
  /** The requested element identifiers, across namespaces. */
  requestedElements: string[]
  validCredentials: MdocCredentialMatch[]
  failedCredentials: MdocCredentialMatch[]
}

/**
 * The claims a credential would disclose, per namespace. An `age_over_NN` request can be answered
 * with a different age attestation (18013-5 7.2.5), so claims are keyed by the element disclosed.
 */
const getDisclosedClaims = (claims: ClaimsMatchResult) => {
  const nameSpaces: MdocNameSpaces = {}
  for (const claim of claims.validClaims) {
    nameSpaces[claim.namespace] ??= {}
    nameSpaces[claim.namespace][claim.disclosedElementIdentifier] = claim.elementValue
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

const toSubmissionEntry = (docRequest: MdocDocRequestMatch): FormattedSubmissionEntry => {
  const [firstValid] = docRequest.validCredentials

  if (!firstValid) {
    return {
      inputDescriptorId: docRequest.docType,
      isSatisfied: false,
      name: docRequest.docType,
      // The element identifier only, the way every unsatisfied mdoc entry lists what it asks for.
      requestedAttributePaths: docRequest.requestedElements.map((element) => [element]),
      // An mdoc of the requested docType that lacks requested elements. Mdocs of another docType
      // are matched too, and fail on their docType: those are other cards, not partial matches.
      partialMatches: docRequest.failedCredentials
        .filter(({ docType, claims }) => docType.success && !claims.success)
        .map(({ record, claims }) => ({
          credential: getCredentialForDisplay(record),
          missingAttributePaths: claims.failedClaims
            .filter((claim) => !claim.optional)
            .map((claim) => [claim.elementIdentifier]),
        })),
    }
  }

  return {
    inputDescriptorId: docRequest.docType,
    isSatisfied: true,
    credentials: [firstValid, ...docRequest.validCredentials.slice(1)].map((credential) =>
      toSatisfiedCredential(credential.record, getDisclosedClaims(credential.claims))
    ) as [FormattedSubmissionEntrySatisfiedCredential, ...FormattedSubmissionEntrySatisfiedCredential[]],
  }
}

/**
 * What an mdoc device request asks for, in the same shape the app's share flow renders, for every
 * transport that carries one: proximity, and the digital credentials API on both platforms.
 *
 * Several doc requests are alternatives, see `selectAlternativeEntry`, so the submission holds the
 * one entry the wallet answers, and `entryIndex` is the index of its doc request.
 */
export function getSubmissionForMdocDocRequestMatches(docRequests: MdocDocRequestMatch[]): {
  submission: FormattedSubmission
  entryIndex: number | undefined
} {
  const entries = docRequests.map(toSubmissionEntry)

  return selectAlternativeEntry({ areAllSatisfied: entries.every((entry) => entry.isSatisfied), entries })
}
