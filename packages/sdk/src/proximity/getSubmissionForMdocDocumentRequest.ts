import type { MdocApi } from '@credo-ts/core'
import { DeviceRequest } from '@owf/mdoc'
import { getSubmissionForMdocRequest } from '../format/mdocDeviceRequest'
import type { FormattedSubmission } from '../format/submission'
import { resolveMdocDeviceRequest } from './resolveMdocDeviceRequest'

export type GetSubmissionForMdocDocumentRequestOptions = {
  /**
   * The wallet's mdoc storage. Not the SDK itself: the credential request UI matches iOS requests
   * with this too, and it runs on a different agent.
   */
  mdocApi: MdocApi
  encodedDeviceRequest: Uint8Array
}

/**
 * What a device request asks for, matched against the wallet's mdocs and answered the same way Credo
 * answers a digital credentials API request, so the review reads the same whichever way the request
 * arrived. See {@link getSubmissionForMdocRequest}.
 */
export async function getSubmissionForMdocDocumentRequest(
  options: GetSubmissionForMdocDocumentRequestOptions
): Promise<FormattedSubmission> {
  const resolvedRequest = await resolveMdocDeviceRequest({
    mdocApi: options.mdocApi,
    deviceRequest: DeviceRequest.decode(options.encodedDeviceRequest),
  })

  return getSubmissionForMdocRequest(
    resolvedRequest,
    resolvedRequest.success ? options.mdocApi.selectCredentialsForRequest(resolvedRequest) : undefined
  )
}
