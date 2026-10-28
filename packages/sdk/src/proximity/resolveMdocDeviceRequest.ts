import {
  type MdocApi,
  type MdocDocRequestInfo,
  type MdocResolvedDocRequest,
  type MdocResolvedDocRequestSuccess,
  type MdocResolvedRequest,
  mapNonEmptyArray,
  TypedArrayEncoder,
} from '@credo-ts/core'
import { type DeviceRequest, type DocRequestInfo, Holder } from '@owf/mdoc'

export type ResolveMdocDeviceRequestOptions = {
  /**
   * The wallet's mdoc storage. Not the SDK itself: the credential request UI resolves iOS requests
   * with this too, and it runs on a different agent.
   */
  mdocApi: MdocApi
  deviceRequest: DeviceRequest
}

/**
 * A device request matched against the wallet's mdocs, in the shape Credo resolves a digital
 * credentials API request in, so `selectCredentialsForRequest` picks the credentials to answer it with
 * the same way on every transport.
 *
 * Credo only resolves `org-iso-mdoc` requests, so for proximity and for the summary iOS gives of a
 * request this matches with `@owf/mdoc`'s `Holder.matchDeviceRequest`, which Credo resolves with too.
 * Several doc requests without use cases are alternatives, the way iOS presents them.
 */
export async function resolveMdocDeviceRequest(options: ResolveMdocDeviceRequestOptions): Promise<MdocResolvedRequest> {
  const { deviceRequest } = options

  const records = await options.mdocApi.findAllByQuery({
    $or: deviceRequest.docRequests.map((docRequest) => ({ docType: docRequest.itemsRequest.docType })),
  })

  const match = Holder.matchDeviceRequest({
    deviceRequest,
    credentials: records.map((record) => record.firstCredential.issuerSigned),
    treatAmbiguousMultipleDocRequestsAsAlternatives: true,
  })

  const docRequests = match.docRequests.map((docRequestMatch): MdocResolvedDocRequest => {
    const { itemsRequest } = deviceRequest.docRequests[docRequestMatch.docRequestIndex]
    const resolvedDocRequest = {
      docRequestIndex: docRequestMatch.docRequestIndex,
      docType: docRequestMatch.docType,
      nameSpaces: Object.fromEntries(
        Array.from(itemsRequest.namespaces, ([nameSpace, elements]) => [nameSpace, Object.fromEntries(elements)])
      ),
      requestInfo: itemsRequest.requestInfo ? toMdocDocRequestInfo(itemsRequest.requestInfo) : undefined,
      failedCredentials: docRequestMatch.failedCredentials.map(({ credentialIndex, ...credential }) => ({
        ...credential,
        record: records[credentialIndex],
      })),
    }

    return docRequestMatch.success
      ? {
          ...resolvedDocRequest,
          success: true,
          validCredentials: mapNonEmptyArray(
            docRequestMatch.validCredentials,
            ({ credentialIndex, ...credential }) => ({
              ...credential,
              record: records[credentialIndex],
            })
          ),
        }
      : { ...resolvedDocRequest, success: false, validCredentials: [] }
  })

  const useCases = match.useCases.map(({ purposeHints, ...useCase }) => ({
    ...useCase,
    purposeHints: purposeHints ? Object.fromEntries(purposeHints) : undefined,
  }))

  if (!match.success) return { success: false, useCasesSource: match.useCasesSource, useCases, docRequests }
  if (match.useCasesSource === 'allDocRequests') {
    // Every doc request is satisfied when the match succeeds on all of them
    return {
      success: true,
      useCasesSource: 'allDocRequests',
      useCases,
      docRequests: docRequests as MdocResolvedDocRequestSuccess[],
    }
  }
  return { success: true, useCasesSource: match.useCasesSource, useCases, docRequests }
}

const toMdocDocRequestInfo = (requestInfo: DocRequestInfo): MdocDocRequestInfo => ({
  alternativeDataElements: requestInfo.alternativeDataElements?.map((set) => ({
    requestedElement: set.requestedElement,
    alternativeElementSets: set.alternativeElementSets,
  })),
  issuerIdentifiers: requestInfo.issuerIdentifiers?.map((issuerIdentifier) =>
    TypedArrayEncoder.toHex(issuerIdentifier)
  ),
  uniqueDocSetRequired: requestInfo.uniqueDocSetRequired,
  maximumResponseSize: requestInfo.maximumResponseSize,
})
