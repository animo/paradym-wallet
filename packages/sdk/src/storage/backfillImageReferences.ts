import { getCredentialForDisplayId } from '../display/credential'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { addImageReferences, isImageStoreBackfilled, setImageStoreBackfilled } from '../utils/imageStore'
import { getActivityIndex, getActivityRecordsByIds } from './activityRecords'
import type { CredentialRecord } from './credentials'
import { getDeferredCredentials } from './deferredCredentialStore'
import {
  activityReference,
  credentialReference,
  deferredCredentialReference,
  getActivityImages,
  getCredentialImages,
  getDeferredCredentialImages,
} from './imageReferences'

/**
 * References the images of the records stored before the image store existed. Once per wallet: it
 * is the only place that reads every activity.
 */
export async function backfillImageReferences(paradym: ParadymWalletSdk) {
  if (isImageStoreBackfilled()) return

  const { agent } = paradym
  const credentials: CredentialRecord[] = (
    await Promise.all([
      agent.sdJwtVc.getAll(),
      agent.mdoc.getAll(),
      agent.w3cCredentials.getAll(),
      agent.w3cV2Credentials.getAll(),
    ])
  ).flat()
  for (const record of credentials) {
    await addImageReferences(credentialReference(getCredentialForDisplayId(record)), getCredentialImages(record))
  }

  for (const deferredCredential of await getDeferredCredentials(paradym)) {
    await addImageReferences(
      deferredCredentialReference(deferredCredential.id),
      getDeferredCredentialImages(deferredCredential)
    )
  }

  const activityIds = (await getActivityIndex(agent)).map(({ id }) => id)
  for (const activity of await getActivityRecordsByIds(agent, activityIds)) {
    await addImageReferences(activityReference(activity.id), getActivityImages(activity))
  }

  setImageStoreBackfilled()
}
