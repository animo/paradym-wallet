import { DeviceRequest, limitDisclosureToDeviceRequestNameSpaces, parseIssuerSigned } from '@animo-id/mdoc'
import type { MdocApi } from '@credo-ts/core'
import { TypedArrayEncoder } from '@credo-ts/core'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { formatAttributesWithRecordMetadata } from '../format/attributes'
import type {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfiedCredential,
} from '../format/submission'

export type GetSubmissionForMdocDocumentRequestOptions = {
  /**
   * The wallet's mdoc storage. Not the SDK itself: the credential request UI matches iOS requests
   * with this too, and it runs on a different agent.
   */
  mdocApi: MdocApi
  encodedDeviceRequest: Uint8Array
}

export async function getSubmissionForMdocDocumentRequest(
  options: GetSubmissionForMdocDocumentRequestOptions
): Promise<FormattedSubmission> {
  const deviceRequest = DeviceRequest.parse(options.encodedDeviceRequest)

  const matchingDocTypeRecords = await options.mdocApi.findAllByQuery({
    $or: deviceRequest.docRequests.map((request) => ({
      docType: request.itemsRequest.data.docType,
    })),
  })

  const mdocs = matchingDocTypeRecords.map((record) => {
    const firstMdoc = record.firstCredential

    return {
      credential: getCredentialForDisplay(record),
      mdoc: firstMdoc,
      // `Mdoc.base64Url` is base64url without padding, so it has to be decoded as that — the
      // strict base64 decoder rejects it as soon as the CBOR contains a byte encoding to `-` or `_`.
      issuerSignedDocument: parseIssuerSigned(TypedArrayEncoder.fromBase64Url(firstMdoc.base64Url), firstMdoc.docType),
    }
  })

  const entries: FormattedSubmissionEntry[] = deviceRequest.docRequests.map((docRequest): FormattedSubmissionEntry => {
    const matchingMdocs = mdocs
      .map((mdoc) => {
        if (mdoc.mdoc.docType !== docRequest.itemsRequest.data.docType) return undefined

        try {
          const disclosedNamespaces = limitDisclosureToDeviceRequestNameSpaces(
            mdoc.issuerSignedDocument,
            docRequest.itemsRequest.data.nameSpaces
          )

          return {
            ...mdoc,
            disclosedNameSpaces: disclosedNamespaces,
          }
        } catch (_error) {
          return undefined
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== undefined)

    if (matchingMdocs.length === 0) {
      const requestedAttributePaths = Array.from(docRequest.itemsRequest.data.nameSpaces.values()).flatMap((value) =>
        Array.from(value.keys()).map((key) => [key])
      )

      return {
        inputDescriptorId: docRequest.itemsRequest.data.docType,
        isSatisfied: false,
        name: docRequest.itemsRequest.data.docType,
        requestedAttributePaths,
      }
    }

    return {
      // input descriptor id is doctype
      inputDescriptorId: docRequest.itemsRequest.data.docType,
      isSatisfied: true,
      credentials: matchingMdocs.map((matchingMdoc): FormattedSubmissionEntrySatisfiedCredential => {
        const disclosedAttributePaths = Array.from(matchingMdoc.disclosedNameSpaces.entries()).flatMap(
          ([namespace, value]) =>
            Array.from(value.values()).map((issuerSignedItem) => [namespace, issuerSignedItem.elementIdentifier])
        )

        const disclosedNamespaces = Object.fromEntries(
          Array.from(matchingMdoc.disclosedNameSpaces.entries()).map(([namespace, value]) => [
            namespace,
            Object.fromEntries(
              Array.from(value.values()).map((issuerSignedItem) => [
                issuerSignedItem.elementIdentifier,
                // TODO: what is element value here?
                issuerSignedItem.elementValue,
              ])
            ),
          ])
        )
        const { metadata } = getAttributesAndMetadataForMdocPayload(disclosedNamespaces, matchingMdoc.mdoc)

        return {
          credential: matchingMdoc.credential,
          disclosed: {
            attributes: formatAttributesWithRecordMetadata(disclosedNamespaces, matchingMdoc.credential.record),
            rawAttributes: disclosedNamespaces,
            metadata,
            paths: disclosedAttributePaths,
          },
        }
      }) as [FormattedSubmissionEntrySatisfiedCredential, ...FormattedSubmissionEntrySatisfiedCredential[]],
    }
  })

  return {
    areAllSatisfied: entries.every((entry) => entry.isSatisfied),
    entries,
  }
}
