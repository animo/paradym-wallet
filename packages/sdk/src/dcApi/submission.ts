import type { IosPresentmentRequest } from '@animo-id/expo-digital-credentials-api/request-handler'
import { DeviceRequest, DocRequest, ItemsRequest } from '@owf/mdoc'

/**
 *
 * What an iOS request asks for, as an ISO 18013-5 `DeviceRequest`.
 *
 * iOS holds the raw request back until the wallet commits to answering it, so there is nothing to
 * match against yet — only the OS's parsed summary. Rebuilding an (unsigned) device request from it
 * means matching runs through the same code the proximity flow uses, instead of a second
 * implementation that could disagree with it about which credential answers.
 *
 * The presentment requests are the use cases of the request (18013-5 second edition 10.2.5), and
 * their document request sets its document sets. iOS presents several doc requests without use cases
 * as alternative sets of one presentment request, which is how the wallet reads them anyway.
 *
 */
export const toDeviceRequest = (presentmentRequests: IosPresentmentRequest[]) => {
  const documentRequests = presentmentRequests.flatMap(({ documentRequestSets }) =>
    documentRequestSets.flatMap(({ documentRequests }) => documentRequests)
  )

  let docRequestIndex = 0
  const useCases = presentmentRequests.map(({ isMandatory, documentRequestSets }) => ({
    mandatory: isMandatory,
    documentSets: documentRequestSets.map(({ documentRequests }) => documentRequests.map(() => docRequestIndex++)),
  }))

  return DeviceRequest.create({
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
    deviceRequestInfo: { useCases },
  })
}
