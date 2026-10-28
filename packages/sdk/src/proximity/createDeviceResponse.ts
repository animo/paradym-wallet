import { type Mdoc, type MdocRecord, MdocService, useInstanceFromCredentialRecord } from '@credo-ts/core'
import { DeviceRequest, DeviceResponse, type Document } from '@owf/mdoc'
import { getDisclosedNameSpacesForSelectedCredential } from '../format/mdocDeviceRequest'
import type { FormattedSubmission } from '../format/submission'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { resolveMdocDeviceRequest } from './resolveMdocDeviceRequest'

export type CreateDeviceResponseOptions = {
  paradym: ParadymWalletSdk
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
  submission: FormattedSubmission
}

/**
 * The encoded device response to a device request, answered with the mdocs of the submission.
 * Sending it is up to the transport.
 *
 * The credentials are selected again from the device request, the same way the submission selected
 * them, so each document discloses the elements, or the alternative sets, the user reviewed.
 */
export async function createDeviceResponse(options: CreateDeviceResponseOptions): Promise<Uint8Array> {
  const { agent } = options.paradym

  const resolvedRequest = await resolveMdocDeviceRequest({
    mdocApi: agent.mdoc,
    deviceRequest: DeviceRequest.decode(options.deviceRequest),
  })
  if (!resolvedRequest.success) throw new Error('The stored cards do not answer the request')

  // FIXME: this selects with `NewOrFirst`, so a credential is re-shared when it has no new instances
  // anymore. We should make this configurable maybe? Or dependant on credential type?
  const { credentials } = agent.mdoc.selectCredentialsForRequest(resolvedRequest)

  // Only the cards the user reviewed: the stored cards may have changed since.
  const reviewedRecordIds = options.submission.entries.flatMap((entry) =>
    entry.isSatisfied ? [(entry.credentials[0].credential.record as MdocRecord).id] : []
  )
  if (
    credentials.length !== reviewedRecordIds.length ||
    credentials.some(({ record }, index) => record.id !== reviewedRecordIds[index])
  ) {
    throw new Error('The cards that answer the request are not the ones that were reviewed')
  }

  const mdocService = agent.dependencyManager.resolve(MdocService)
  const documents: Document[] = []

  for (const credential of credentials) {
    const { credentialInstance } = await useInstanceFromCredentialRecord({
      credentialRecord: credential.record,
      agentContext: agent.context,
      useMode: credential.useMode,
    })

    // A device request with just the elements to disclose, so the alternative sets and `age_over_NN`
    // attestations that answer the request are disclosed as they are. One response per document, so
    // two documents of the same docType each disclose their own elements.
    const disclosed = getDisclosedNameSpacesForSelectedCredential(resolvedRequest, credential)
    const { deviceResponse } = await mdocService.createDeviceResponse(agent.context, {
      mdocs: [credentialInstance as Mdoc],
      documentRequests: [
        {
          docType: credential.record.firstCredential.docType,
          nameSpaces: Object.fromEntries(
            Object.entries(disclosed).map(([nameSpace, elements]) => [
              nameSpace,
              Object.fromEntries(Object.keys(elements).map((element) => [element, false])),
            ])
          ),
        },
      ],
      sessionTranscriptOptions: {
        type: 'sessionTranscriptBytes',
        sessionTranscriptBytes: options.sessionTranscript,
      },
    })

    documents.push(...(deviceResponse.documents ?? []))
  }

  return DeviceResponse.createSimple({ version: '1.0', documents }).encode()
}
