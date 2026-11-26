import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { getCredentialForDisplayId } from '../display/credential'
import { useParadym } from '../hooks/useParadym'
import { useMdocRecords } from '../providers/MdocProvider'
import { useSdJwtVcRecords } from '../providers/SdJwtVcProvider'
import { useW3cCredentialRecords } from '../providers/W3cCredentialsProvider'
import { useW3cV2CredentialRecords } from '../providers/W3cV2CredentialsProvider'
import { useWalletJsonRecord } from '../providers/WalletJsonStoreProvider'
import { addImageReferences, isImageStoreBackfilled, setImageStoreBackfilled } from '../utils/imageStore'
import { type ActivityIndex, activityIndexStore, activityQueryKey, getActivityRecordById } from './activityRecords'
import { useDeferredCredentials } from './deferredCredentialStore'
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
export function BackfillImageReferences() {
  const { paradym } = useParadym('unlocked')
  const queryClient = useQueryClient()
  const { w3cCredentialRecords, isLoading: isLoadingW3c } = useW3cCredentialRecords()
  const { w3cV2CredentialRecords, isLoading: isLoadingW3cV2 } = useW3cV2CredentialRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwt } = useSdJwtVcRecords()
  const { mdocRecords, isLoading: isLoadingMdoc } = useMdocRecords()
  const { deferredCredentials, isLoading: isLoadingDeferred } = useDeferredCredentials()
  const { record: activityIndex, isLoading: isLoadingActivityIndex } = useWalletJsonRecord<ActivityIndex>(
    activityIndexStore.recordId
  )
  const isLoading =
    isLoadingW3c || isLoadingW3cV2 || isLoadingSdJwt || isLoadingMdoc || isLoadingDeferred || isLoadingActivityIndex
  const hasStarted = useRef(false)

  useEffect(() => {
    if (isLoading || hasStarted.current || isImageStoreBackfilled()) return
    hasStarted.current = true

    const backfill = async () => {
      for (const record of [...w3cCredentialRecords, ...w3cV2CredentialRecords, ...sdJwtVcRecords, ...mdocRecords]) {
        await addImageReferences(credentialReference(getCredentialForDisplayId(record)), getCredentialImages(record))
      }

      for (const deferredCredential of deferredCredentials) {
        await addImageReferences(
          deferredCredentialReference(deferredCredential.id),
          getDeferredCredentialImages(deferredCredential)
        )
      }

      // Through the activity cache, so the activities the wallet already read aren't read again.
      const activities = await Promise.all(
        (activityIndex?.entries ?? []).map(({ id }) =>
          queryClient.ensureQueryData({
            queryKey: activityQueryKey(id),
            queryFn: () => getActivityRecordById(paradym.agent, id),
          })
        )
      )
      for (const activity of activities) {
        if (activity) await addImageReferences(activityReference(activity.id), getActivityImages(activity))
      }

      setImageStoreBackfilled()
    }

    backfill().catch((error) => paradym.logger.error('Failed to store the images of the wallet', { error }))
  }, [
    isLoading,
    paradym,
    queryClient,
    w3cCredentialRecords,
    w3cV2CredentialRecords,
    sdJwtVcRecords,
    mdocRecords,
    deferredCredentials,
    activityIndex,
  ])

  return null
}
