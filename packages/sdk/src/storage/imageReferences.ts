import {
  type CredentialForDisplayId,
  deriveCredentialForDisplay,
  getCredentialForDisplay,
  getCredentialForDisplayId,
} from '../display/credential'
import { getOpenId4VcCredentialDisplay } from '../display/openid4vc'
import { extractOpenId4VcCredentialMetadata } from '../metadata/credentials'
import { addImageReferences, type ImageUse, removeImageReferences, setImageReferences } from '../utils/imageStore'
import type { Activity } from './activityStore'
import type { CredentialRecord } from './credentials'
import type { DeferredCredential } from './deferredCredentialStore'

// The images of a record, as they are shown now. Images shown only in another language are left to
// expo-image.

export function getCredentialImages(record: CredentialRecord, isChangedInPlace = false): ImageUse[] {
  const { display } = isChangedInPlace ? deriveCredentialForDisplay(record) : getCredentialForDisplay(record)
  return [
    { url: display.issuer.logo?.url, kind: 'logo' },
    { url: display.backgroundImage?.url, kind: 'background' },
  ]
}

export function getDeferredCredentialImages({ response, issuerMetadata }: DeferredCredential): ImageUse[] {
  const display = getOpenId4VcCredentialDisplay(
    extractOpenId4VcCredentialMetadata(response.credentialConfiguration, {
      display: issuerMetadata.credentialIssuer?.display,
      id: issuerMetadata.credentialIssuer?.credential_issuer,
    })
  )
  return [
    { url: display.issuer.logo?.url, kind: 'logo' },
    { url: display.backgroundImage?.url, kind: 'background' },
  ]
}

export const getActivityImages = (activity: Activity): ImageUse[] => [{ url: activity.entity.logo?.url, kind: 'logo' }]

export const credentialReference = (credentialId: CredentialForDisplayId) => `credential:${credentialId}`
export const deferredCredentialReference = (id: string) => `deferred:${id}`
export const activityReference = (id: string) => `activity:${id}`

// Not awaited by the callers: the record is saved either way, and a copy that couldn't be made
// leaves the image to expo-image.
const ignoreErrors = (task: () => Promise<unknown>) => {
  try {
    void task().catch(() => {})
  } catch {}
}

export const referenceCredentialImages = (record: CredentialRecord) =>
  ignoreErrors(() =>
    addImageReferences(credentialReference(getCredentialForDisplayId(record)), getCredentialImages(record))
  )

/** For a record whose metadata was changed in place, which can point to other images. */
export const updateCredentialImageReferences = (record: CredentialRecord) =>
  ignoreErrors(() =>
    setImageReferences(credentialReference(getCredentialForDisplayId(record)), getCredentialImages(record, true))
  )

export const unreferenceCredentialImages = (credentialId: CredentialForDisplayId) =>
  ignoreErrors(() => removeImageReferences(credentialReference(credentialId)))

export const referenceDeferredCredentialImages = (deferredCredential: DeferredCredential) =>
  ignoreErrors(() =>
    addImageReferences(
      deferredCredentialReference(deferredCredential.id),
      getDeferredCredentialImages(deferredCredential)
    )
  )

export const unreferenceDeferredCredentialImages = (id: string) =>
  ignoreErrors(() => removeImageReferences(deferredCredentialReference(id)))

export const updateActivityImageReferences = (activity: Activity) =>
  ignoreErrors(() => setImageReferences(activityReference(activity.id), getActivityImages(activity)))

export const unreferenceActivityImages = (id: string) =>
  ignoreErrors(() => removeImageReferences(activityReference(id)))
