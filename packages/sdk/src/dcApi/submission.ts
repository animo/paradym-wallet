import type { IosDocumentRequest } from '@animo-id/expo-digital-credentials-api/request-handler'
import { DeviceRequest } from '@animo-id/mdoc'
import type { MdocDcApiCredentialMatch, MdocDcApiResolvedRequest, MdocNameSpaces, MdocRecord } from '@credo-ts/core'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { formatAttributesWithRecordMetadata } from '../format/attributes'
import type {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfiedCredential,
} from '../format/submission'

/**
 *
 * The order the request UI shows matches in, and the order a response is built from: a credential
 * that carries every requested element first, so what the user reviewed is what gets shared.
 *
 */
export const orderMdocMatches = <T extends { isFullMatch: boolean }>(matches: T[]) =>
  [...matches].sort((a, b) => Number(b.isFullMatch) - Number(a.isFullMatch))

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

const requestedPaths = (nameSpaces: Record<string, Record<string, unknown>>) =>
  Object.entries(nameSpaces).flatMap(([namespace, elements]) =>
    Object.keys(elements).map((element) => [namespace, element])
  )

/**
 *
 * What an `org-iso-mdoc` request asks for, in the same shape the app's share flow renders.
 *
 * Credo already matched the request against the wallet's mdocs, so each document request either has
 * candidates with the exact claims they would disclose, or none at all.
 *
 */
export const getSubmissionForMdocDcApiRequest = (resolvedRequest: MdocDcApiResolvedRequest): FormattedSubmission => {
  const entries = resolvedRequest.docRequests.map((docRequest): FormattedSubmissionEntry => {
    const matches: MdocDcApiCredentialMatch[] = orderMdocMatches(docRequest.matches)

    if (matches.length === 0) {
      return {
        inputDescriptorId: docRequest.docType,
        isSatisfied: false,
        name: docRequest.docType,
        requestedAttributePaths: requestedPaths(docRequest.nameSpaces),
      }
    }

    return {
      inputDescriptorId: docRequest.docType,
      isSatisfied: true,
      credentials: matches.map((match) => toSatisfiedCredential(match.record, match.disclosedClaims)),
    }
  })

  return { areAllSatisfied: entries.every((entry) => entry.isSatisfied), entries }
}

/**
 *
 * What an iOS request asks for, as an ISO 18013-5 `DeviceRequest`.
 *
 * iOS holds the raw request back until the wallet commits to answering it, so there is nothing to
 * match against yet — only the OS's parsed summary. Rebuilding an (unsigned) device request from it
 * means matching runs through the same code the proximity flow uses, instead of a second
 * implementation that could disagree with it about which credential answers.
 *
 */
export const toDeviceRequest = (documentRequests: IosDocumentRequest[]) =>
  DeviceRequest.from(
    '1.0',
    documentRequests.map((documentRequest) => ({
      itemsRequestData: {
        docType: documentRequest.doctype,
        nameSpaces: new Map(
          Object.entries(documentRequest.namespaces).map(([namespace, elements]) => [
            namespace,
            new Map(Object.entries(elements).map(([element, { intentToRetain }]) => [element, intentToRetain])),
          ])
        ),
      },
    }))
  ).encode()
