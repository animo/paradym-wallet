import {
  DeviceRequest,
  type IssuerSignedDocument,
  type IssuerSignedItem,
  MDoc,
  parseIssuerSigned,
} from '@animo-id/mdoc'
import { TypedArrayEncoder } from '@credo-ts/core'
import type { EitherAgent } from '../agent'
import { getAttributesAndMetadataForMdocPayload, getCredentialForDisplay } from '../display'
import type {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfiedCredential,
} from './formatPresentation'

type DeviceRequestNameSpaces = DeviceRequest['docRequests'][number]['itemsRequest']['data']['nameSpaces']

// FIXME: needs to be exported from mdoc
export const limitDisclosureToDeviceRequestNameSpaces = (
  mdoc: IssuerSignedDocument,
  deviceRequestNameSpaces: DeviceRequestNameSpaces
): Map<string, IssuerSignedItem[]> => {
  const nameSpaces: Map<string, IssuerSignedItem[]> = new Map()

  for (const [nameSpace, nameSpaceFields] of deviceRequestNameSpaces.entries()) {
    const nsAttrs = mdoc.issuerSigned.nameSpaces.get(nameSpace) ?? []
    const digests = Array.from(nameSpaceFields.entries()).map(([elementIdentifier, _]) => {
      const digest = prepareDigest(elementIdentifier, nsAttrs)
      if (!digest) {
        throw new Error(`No matching field found for '${elementIdentifier}'`)
      }
      return digest
    })

    nameSpaces.set(nameSpace, digests)
  }
  return nameSpaces
}

const prepareDigest = (elementIdentifier: string, nsAttrs: IssuerSignedItem[]): IssuerSignedItem | null => {
  if (elementIdentifier.startsWith('age_over_')) {
    const digest = handleAgeOverNN(elementIdentifier, nsAttrs)
    return digest
  }

  const digest = nsAttrs.find((d) => d.elementIdentifier === elementIdentifier)
  return digest ?? null
}

const handleAgeOverNN = (request: string, attributes: IssuerSignedItem[]): IssuerSignedItem | null => {
  const ageOverList = attributes
    .map((a, i) => {
      const { elementIdentifier: key, elementValue: value } = a
      return { key, value, index: i }
    })
    .filter((i) => i.key.startsWith('age_over_'))
    .map((i) => ({
      nn: Number.parseInt(i.key.replace('age_over_', ''), 10),
      ...i,
    }))
    .sort((a, b) => a.nn - b.nn)

  const reqNN = Number.parseInt(request.replace('age_over_', ''), 10)

  let item: (typeof ageOverList)[number] | undefined
  // Find nearest TRUE
  item = ageOverList.find((i) => i.value === true && i.nn >= reqNN)

  if (!item) {
    // Find the nearest False
    item = ageOverList.sort((a, b) => b.nn - a.nn).find((i) => i.value === false && i.nn <= reqNN)
  }

  if (!item) {
    return null
  }

  return attributes[item.index]
}

export async function getSubmissionForMdocDocumentRequest(
  agent: EitherAgent,
  encodedDeviceRequest: Uint8Array
): Promise<FormattedSubmission> {
  const deviceRequest = DeviceRequest.parse(encodedDeviceRequest)

  const matchingDocTypeRecords = await agent.mdoc.findAllByQuery({
    $or: deviceRequest.docRequests.map((request) => ({
      docType: request.itemsRequest.data.docType,
    })),
  })

  const mdocs = matchingDocTypeRecords.map((record) => {
    const mdoc = record.credential

    return {
      credential: getCredentialForDisplay(record),
      mdoc,
      issuerSignedDocument: parseIssuerSigned(TypedArrayEncoder.fromBase64(mdoc.base64Url), mdoc.docType),
    }
  })

  const entries: FormattedSubmissionEntry[] = deviceRequest.docRequests.map((docRequest): FormattedSubmissionEntry => {
    const matchingMdocs = mdocs
      .map((mdoc) => {
        if (mdoc.mdoc.docType !== docRequest.itemsRequest.data.docType) return undefined

        try {
          const disclosedNameSpaces = limitDisclosureToDeviceRequestNameSpaces(
            mdoc.issuerSignedDocument,
            docRequest.itemsRequest.data.nameSpaces
          )
          return {
            ...mdoc,
            disclosedNameSpaces,
          }
        } catch (error) {
          return undefined
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== undefined)

    if (matchingMdocs.length === 0) {
      const requestedAttributePaths = Array.from(docRequest.itemsRequest.data.nameSpaces.entries())
        .flatMap(([namespace, value]) =>
          Array.from(value.entries()).map(([key, isDisclosed]) => (isDisclosed ? [namespace, key] : undefined))
        )
        .filter((path): path is [string, string] => path !== undefined)

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
