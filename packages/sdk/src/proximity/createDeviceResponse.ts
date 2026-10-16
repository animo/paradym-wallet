import {
  CredentialMultiInstanceUseMode,
  type Mdoc,
  type MdocRecord,
  MdocService,
  useInstanceFromCredentialRecord,
} from '@credo-ts/core'
import { DeviceRequest } from '@owf/mdoc'
import type { FormattedSubmission } from '../format/submission'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'

export type CreateDeviceResponseOptions = {
  paradym: ParadymWalletSdk
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
  submission: FormattedSubmission
}

/**
 * The encoded device response to a device request, answered with the mdocs of the submission.
 * Sending it is up to the transport.
 */
export async function createDeviceResponse(options: CreateDeviceResponseOptions): Promise<Uint8Array> {
  // TODO: rewrite this to the deviceRequest matching logic now available in mdoc/credo libraries.
  // that also supports treating multiple doc requests as OR instead of AND, which seems to be the standard
  // if no useCases are provided.
  // if (!options.submission.areAllSatisfied) {
  //   throw new Error('Not all requirements are satisfied')
  // }

  const mdocs = await Promise.all(
    options.submission.entries.map(async (e) => {
      if (!e.isSatisfied) throw new Error(`Requirement for doctype ${e.inputDescriptorId} not satisfied`)

      const credentialRecord = e.credentials[0].credential.record as MdocRecord

      // Optionally handle batch issuance
      const { credentialInstance } = await useInstanceFromCredentialRecord({
        credentialRecord,
        agentContext: options.paradym.agent.context,
        // FIXME: we currently allow re-sharing if we don't have new instances anymore
        // we should make this configurable maybe? Or dependant on credential type?
        useMode: CredentialMultiInstanceUseMode.NewOrFirst,
      })

      return credentialInstance
    })
  )

  const mdocService = options.paradym.agent.dependencyManager.resolve(MdocService)

  const deviceResponse = await mdocService.createDeviceResponse(options.paradym.agent.context, {
    documentRequests: DeviceRequest.decode(options.deviceRequest).docRequests.map((d) => ({
      docType: d.itemsRequest.docType,
      nameSpaces: Object.fromEntries(
        Array.from(d.itemsRequest.namespaces.entries()).map(([namespace, entry]) => [
          namespace,
          Object.fromEntries(Array.from(entry.entries())),
        ])
      ),
    })),
    mdocs: mdocs as [Mdoc, ...Mdoc[]],
    sessionTranscriptOptions: {
      type: 'sessionTranscriptBytes',
      sessionTranscriptBytes: options.sessionTranscript,
    },
  })

  return deviceResponse.deviceResponse.encode()
}
