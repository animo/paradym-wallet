import { DeviceRequest, limitDisclosureToDeviceRequestNameSpaces, parseIssuerSigned } from '@animo-id/mdoc'
import { TypedArrayEncoder } from '@credo-ts/core'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import type {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfiedCredential,
} from './submission'

export async function getSubmissionForMdocDocumentRequest(
  paradym: ParadymWalletSdk,
  encodedDeviceRequest: Uint8Array
): Promise<FormattedSubmission> {
  const deviceRequest = DeviceRequest.parse(encodedDeviceRequest)

  const matchingDocTypeRecords = await paradym.agent.mdoc.findAllByQuery({
    $or: deviceRequest.docRequests.map((request) => ({
      docType: request.itemsRequest.data.docType,
    })),
  })

  const mdocs = matchingDocTypeRecords.map((record) => ({
    credential: getCredentialForDisplay(record),
    mdoc: record.credential,
    issuerSignedDocument: parseIssuerSigned(
      TypedArrayEncoder.fromBase64(record.credential.base64Url),
      record.credential.docType
    ),
  }))

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
        } catch (error) {
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
        const { attributes, metadata } = getAttributesAndMetadataForMdocPayload(disclosedNamespaces, matchingMdoc.mdoc)

        return {
          credential: matchingMdoc.credential,
          disclosed: {
            attributes,
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
