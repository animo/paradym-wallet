import { type Agent, RecordNotFoundError } from '@credo-ts/core'
import { type CredentialForDisplayId, getCredentialForDisplay } from '../display/credential'
import { type ClaimPath, getClaimPathsForMdocNamespaces } from '../format/attributes'
import type { Activity, PresentationActivityCredential, PresentationActivityCredentialNotFound } from './activityStore'
import type { CredentialRecord } from './credentials'

/**
 * A shared credential as stored before v3, with the disclosed values themselves.
 *
 * `version` undefined is v1, which stores the elements of an mdoc without their namespace; v2 stores the
 * full mdoc namespace structure. Nothing writes them any more, and they are upgraded to v3 when read.
 */
type LegacyPresentationActivityCredential = {
  version?: 'v2'
  id: CredentialForDisplayId
  name?: string
  attributeNames: string[]
  attributes: Record<string, unknown>
  metadata: Record<string, unknown>
}

type StoredPresentationActivityCredential =
  | PresentationActivityCredential
  | LegacyPresentationActivityCredential
  | PresentationActivityCredentialNotFound

const isLegacyCredential = (
  credential: StoredPresentationActivityCredential
): credential is LegacyPresentationActivityCredential => 'id' in credential && credential.version !== 'v3'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype

/**
 * Whether an activity holds shared credentials stored before v3.
 */
export function isLegacyActivity(activity: Activity) {
  return (
    activity.type !== 'received' &&
    (activity.request.credentials as StoredPresentationActivityCredential[]).some(isLegacyCredential)
  )
}

/**
 * The activity with its shared credentials stored before v3 upgraded to v3, which records the paths to
 * the disclosed claims instead of their values.
 *
 * Values stored before v3 are the reason an activity could be as large as the credentials it shared,
 * which made the activity slow to read and opening what it shared hang the app.
 */
export async function upgradeLegacyActivity(agent: Agent, activity: Activity): Promise<Activity> {
  if (!isLegacyActivity(activity) || activity.type === 'received') return activity

  const credentials = await Promise.all(
    (activity.request.credentials as StoredPresentationActivityCredential[]).map((credential) =>
      isLegacyCredential(credential) ? upgradeLegacyCredential(agent, credential) : credential
    )
  )

  return { ...activity, request: { ...activity.request, credentials } }
}

async function upgradeLegacyCredential(
  agent: Agent,
  credential: LegacyPresentationActivityCredential
): Promise<PresentationActivityCredential> {
  const record = await findCredentialRecord(agent, credential.id)
  const rawAttributes = record ? getCredentialForDisplay(record).rawAttributes : undefined

  return {
    version: 'v3',
    id: credential.id,
    name: credential.name,
    attributeNames: credential.attributeNames,
    paths: getPathsForLegacyCredential(credential, rawAttributes),
  }
}

/**
 * The paths to the claims a credential stored before v3 disclosed, from the values it stored.
 *
 * The values are followed down only as far as the credential still has objects, so a value that was not
 * a plain object when it was shared, such as a portrait that was stored as its bytes, is a single claim.
 * An array is a single claim as well: which elements it held is not known from the stored values.
 *
 * Once the credential has been deleted there is nothing to follow them down in, and only the names it
 * stored are shown, so the top-level claims are enough.
 */
function getPathsForLegacyCredential(
  credential: LegacyPresentationActivityCredential,
  rawAttributes: Record<string, unknown> | undefined
): ClaimPath[] {
  if (credential.id.startsWith('mdoc-')) {
    if (credential.version === 'v2') {
      return getClaimPathsForMdocNamespaces(credential.attributes as Record<string, Record<string, unknown>>)
    }

    // v1 stored the elements without their namespace, which only the credential still tells
    const namespaces = Object.entries((rawAttributes ?? {}) as Record<string, Record<string, unknown>>)
    return Object.keys(credential.attributes).flatMap((element) =>
      namespaces.filter(([, elements]) => element in elements).map(([namespace]): ClaimPath => [namespace, element])
    )
  }

  if (!rawAttributes) return Object.keys(credential.attributes).map((claim) => [claim])

  const getPaths = (value: unknown, credentialValue: unknown, path: ClaimPath): ClaimPath[] =>
    isPlainObject(value) && isPlainObject(credentialValue)
      ? Object.keys(value).flatMap((key) =>
          key in credentialValue ? getPaths(value[key], credentialValue[key], [...path, key]) : []
        )
      : [path]

  return getPaths(credential.attributes, rawAttributes, [])
}

async function findCredentialRecord(
  agent: Agent,
  credentialId: CredentialForDisplayId
): Promise<CredentialRecord | undefined> {
  try {
    if (credentialId.startsWith('w3c-v2-credential-')) {
      return await agent.w3cV2Credentials.getById(credentialId.replace('w3c-v2-credential-', ''))
    }
    if (credentialId.startsWith('w3c-credential-')) {
      return await agent.w3cCredentials.getById(credentialId.replace('w3c-credential-', ''))
    }
    if (credentialId.startsWith('sd-jwt-vc-')) {
      return await agent.sdJwtVc.getById(credentialId.replace('sd-jwt-vc-', ''))
    }
    if (credentialId.startsWith('mdoc-')) {
      return await agent.mdoc.getById(credentialId.replace('mdoc-', ''))
    }

    return undefined
  } catch (error) {
    if (error instanceof RecordNotFoundError) return undefined
    throw error
  }
}
