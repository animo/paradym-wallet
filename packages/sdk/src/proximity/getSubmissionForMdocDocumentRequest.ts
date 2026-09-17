import type { MdocApi } from '@credo-ts/core'
import { type CredentialMatch, DeviceRequest, Holder } from '@owf/mdoc'
import { getSubmissionForMdocDocRequestMatches } from '../format/mdocDeviceRequest'
import type { FormattedSubmission } from '../format/submission'

export type GetSubmissionForMdocDocumentRequestOptions = {
  /**
   * The wallet's mdoc storage. Not the SDK itself: the credential request UI matches iOS requests
   * with this too, and it runs on a different agent.
   */
  mdocApi: MdocApi
  encodedDeviceRequest: Uint8Array
}

/**
 * What a device request asks for, matched against the wallet's mdocs the same way Credo matches a
 * digital credentials API request — both go through `@owf/mdoc`'s `Holder.matchDeviceRequest` — so
 * the review reads the same whichever way the request arrived.
 *
 * Several doc requests are alternatives, see `selectAlternativeEntry`: the submission holds the one
 * document the wallet answers.
 */
export async function getSubmissionForMdocDocumentRequest(
  options: GetSubmissionForMdocDocumentRequestOptions
): Promise<FormattedSubmission> {
  const deviceRequest = DeviceRequest.decode(options.encodedDeviceRequest)

  const records = await options.mdocApi.findAllByQuery({
    $or: deviceRequest.docRequests.map((docRequest) => ({ docType: docRequest.itemsRequest.docType })),
  })

  const match = Holder.matchDeviceRequest({
    deviceRequest,
    credentials: records.map((record) => record.firstCredential.issuerSigned),
    treatAmbiguousMultipleDocRequestsAsAlternatives: true,
  })

  const withRecord = (credential: CredentialMatch) => ({ ...credential, record: records[credential.credentialIndex] })

  return getSubmissionForMdocDocRequestMatches(
    match.docRequests.map((docRequestMatch) => ({
      docType: docRequestMatch.docType,
      requestedElements: Array.from(
        deviceRequest.docRequests[docRequestMatch.docRequestIndex].itemsRequest.namespaces.values()
      ).flatMap((elements) => Array.from(elements.keys())),
      validCredentials: docRequestMatch.validCredentials.map(withRecord),
      failedCredentials: docRequestMatch.failedCredentials.map(withRecord),
    }))
  ).submission
}
