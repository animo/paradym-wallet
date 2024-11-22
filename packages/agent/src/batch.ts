import { Mdoc, MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@credo-ts/core'
import type { EitherAgent } from './agent'
import { decodeW3cCredential } from './format/credentialEncoding'
import { getBatchCredentialMetadata } from './openid4vc/batchMetadata'
import { updateCredential } from './storage'

/**
 * If available, takes a credential from the batch.
 *
 * @todo: what if batch is gone?
 */
export async function handleBatchCredential(
  agent: EitherAgent,
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord
) {
  const batchMetadata = getBatchCredentialMetadata(credentialRecord)

  if (batchMetadata) {
    const batchCredential = batchMetadata.additionalCredentials.pop()

    if (batchCredential) {
      // Store the record with the used credential removed. Even if the presentation fails we remove it, as we want to be careful
      // if the presentation was shared
      await updateCredential(agent, credentialRecord)

      if (credentialRecord instanceof MdocRecord) {
        return new MdocRecord({
          mdoc: Mdoc.fromBase64Url(batchCredential as string),
        })
      }
      if (credentialRecord instanceof SdJwtVcRecord) {
        return new SdJwtVcRecord({
          compactSdJwtVc: batchCredential as string,
        })
      }
      if (credentialRecord instanceof W3cCredentialRecord) {
        return new W3cCredentialRecord({
          tags: { expandedTypes: [] },
          credential: decodeW3cCredential(batchCredential),
        })
      }
    }
  }

  return credentialRecord
}
