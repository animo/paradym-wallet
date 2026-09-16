import type { IosDocumentRequest } from '@animo-id/expo-digital-credentials-api/request-handler'
import type { MdocDcApiResolvedDocRequest, MdocDcApiResolvedRequest } from '@credo-ts/core'
import { DeviceRequest, DocRequest, ItemsRequest } from '@owf/mdoc'
import { getSubmissionForMdocDocRequestMatches } from '../format/mdocDeviceRequest'
import type { FormattedSubmission } from '../format/submission'

/**
 *
 * What an `org-iso-mdoc` request asks for, in the same shape the app's share flow renders.
 *
 * Credo already matched the request against the wallet's mdocs. Only a credential carrying every
 * requested element answers a doc request; one of the requested docType that lacks some is shown
 * with what it lacks.
 *
 * Resolve the request with `treatAmbiguousMultipleDocRequestsAsAlternatives`: several doc requests
 * are alternatives, so this also returns the one doc request the review is for — the one to answer,
 * and the only one.
 *
 */
export const getSubmissionForMdocDcApiRequest = (
  resolvedRequest: MdocDcApiResolvedRequest
): { submission: FormattedSubmission; docRequest: MdocDcApiResolvedDocRequest | undefined } => {
  const { submission, entryIndex } = getSubmissionForMdocDocRequestMatches(
    resolvedRequest.docRequests.map((docRequest) => ({
      docType: docRequest.docType,
      requestedElements: Object.values(docRequest.nameSpaces).flatMap((elements) => Object.keys(elements)),
      validCredentials: docRequest.validCredentials,
      failedCredentials: docRequest.failedCredentials,
    }))
  )

  return {
    submission,
    docRequest: entryIndex === undefined ? undefined : resolvedRequest.docRequests[entryIndex],
  }
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
  DeviceRequest.create({
    docRequests: documentRequests.map((documentRequest) =>
      DocRequest.create({
        itemsRequest: ItemsRequest.create({
          docType: documentRequest.doctype,
          namespaces: new Map(
            Object.entries(documentRequest.namespaces).map(([namespace, elements]) => [
              namespace,
              new Map(Object.entries(elements).map(([element, { intentToRetain }]) => [element, intentToRetain])),
            ])
          ),
        }),
      })
    ),
    version: '1.0',
  }).encode()
