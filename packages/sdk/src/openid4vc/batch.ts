import { Mdoc, MdocRecord, SdJwtVcRecord, W3cCredentialRecord, W3cV2CredentialRecord } from '@credo-ts/core'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import {
  type RefreshCredentialMetadata,
  getBatchCredentialMetadata,
  getRefreshCredentialMetadata,
} from '../metadata/credentials'
import { type CredentialRecord, updateCredential } from '../storage/credentials'
import { decodeW3cCredential, decodeW3cV2Credential } from '../utils/encoding'

export type FetchBatchCredentialOptions = {
  paradym: ParadymWalletSdk
  credentialRecord: CredentialRecord
  refreshMetadata: RefreshCredentialMetadata
}
export type FetchBatchCredentialCallback = (options: FetchBatchCredentialOptions) => Promise<CredentialRecord>

/**
 * If available, takes a credential from the batch.
 *
 * @todo what if batch is gone?
 *
 * @todo does not deal with the PID anymore as it is a generic SDK. How do we want to deal with this now?
 */
export async function handleBatchCredential(
  paradym: ParadymWalletSdk,
  credentialRecord: CredentialRecord,
  fetchBatchCredentialCallback?: FetchBatchCredentialCallback
): Promise<CredentialRecord> {
  const batchMetadata = getBatchCredentialMetadata(credentialRecord)
  if (!batchMetadata) return credentialRecord

  // TODO: maybe we should also store the main credential in the additional credentials (and rename it)
  // As right now the main one is mostly for display
  const batchCredential = batchMetadata.additionalCredentials.pop()

  // Store the record with the used credential removed. Even if the presentation fails we remove it, as we want to be careful
  // if the presentation was shared
  if (batchCredential) await updateCredential(paradym, credentialRecord)

  const refreshMetadata = getRefreshCredentialMetadata(credentialRecord)

  if (fetchBatchCredentialCallback && batchMetadata.additionalCredentials.length === 0 && refreshMetadata) {
    return await fetchBatchCredentialCallback({ paradym, credentialRecord, refreshMetadata })
  }

  if (batchCredential) {
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
    if (credentialRecord instanceof W3cV2CredentialRecord) {
      return new W3cV2CredentialRecord({
        credential: decodeW3cV2Credential(batchCredential as string),
      }) as CredentialRecord
    }
  }

  return credentialRecord
}
