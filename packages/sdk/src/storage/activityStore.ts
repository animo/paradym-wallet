import type { Agent } from '@credo-ts/core'
import { utils } from '@credo-ts/core'
import { useMemo } from 'react'
import { getDisclosedAttributeNamesForDisplay, getUnsatisfiedAttributePathsForDisplay } from '../display/common'
import type { CredentialDisplay, CredentialForDisplayId, DisplayImage } from '../display/credential'
import type { FormattedSubmission } from '../format/submission'
import type { CredentialId } from '../hooks/useCredentialById'
import type { CredentialsForProofRequest } from '../openid4vc/func/resolveCredentialRequest'
import type { FormattedTransactionData } from '../openid4vc/transaction'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { useWalletJsonRecord } from '../providers/WalletJsonStoreProvider'
import { getWalletJsonStore } from './walletJsonStore'

export type ActivityType = 'shared' | 'received' | 'signed'
export type ActivityStatus = 'success' | 'failed' | 'stopped' | 'pending'
export type SharingFailureReason = 'missing_credentials' | 'unknown'

interface BaseActivity {
  id: string
  type: ActivityType
  status: ActivityStatus
  date: string
  entity: {
    // FIXME: we need to avoid id collisions. So we should
    // add a prefix probably. So
    // didcomm-connection:
    //
    // entity id can either be: did or https url or connection id
    id?: string
    host?: string
    name?: string
    logo?: DisplayImage
    backgroundColor?: string
  }
}

export interface PresentationActivityCredentialNotFound {
  attributeNames: string[]
  name?: string
}

export interface PresentationActivityCredential {
  id: CredentialId
  name?: string
  attributeNames: string[]
  attributes: Record<string, unknown>
  metadata: Record<string, unknown>
}

export interface PresentationActivity extends BaseActivity {
  type: 'shared'
  status: Exclude<ActivityStatus, 'pending'>
  request: {
    credentials: Array<PresentationActivityCredential | PresentationActivityCredentialNotFound>
    name?: string
    purpose?: string
    failureReason?: SharingFailureReason
  }
}

export interface IssuanceActivity extends BaseActivity {
  type: 'received'
  status: ActivityStatus
  deferredCredentials?: CredentialDisplay[]
  credentialIds: CredentialForDisplayId[]
}

export interface SignedActivity extends Omit<PresentationActivity, 'type'> {
  type: 'signed'
  status: Exclude<ActivityStatus, 'pending'>
  transaction: FormattedTransactionData
}

export type Activity = PresentationActivity | IssuanceActivity | SignedActivity

export type ActivityRecord = {
  activities: Activity[]
}

const internalActivityStorage = getWalletJsonStore<ActivityRecord>('EASYPID_ACTIVITY_RECORD')
// const internalActivityStorage = getWalletJsonStore<ActivityRecord>('PARADYM_WALLET_SDK_ACTIVITY_RECORD')
export const activityStorage = {
  recordId: internalActivityStorage.recordId,
  addActivity: async (agent: Agent, activity: Activity) => {
    // get activity and then add this activity
    const record = await internalActivityStorage.get(agent)
    if (!record) {
      await internalActivityStorage.store(agent, {
        activities: [activity],
      })
    } else {
      record.activities.push(activity)
      await internalActivityStorage.update(agent, record)
    }

    return activity
  },
  deleteActivity: async (agent: Agent, id: string) => {
    const record = await internalActivityStorage.get(agent)
    if (!record) {
      throw new Error('No activity record found')
    }

    record.activities = record.activities.filter((d) => d.id !== id)
    await internalActivityStorage.update(agent, record)
  },
}

export const useActivities = ({ filters }: { filters?: { entityId?: string } } = {}) => {
  const { record, isLoading } = useWalletJsonRecord<ActivityRecord>(activityStorage.recordId)

  const activities = useMemo(() => {
    if (!record?.activities) return []

    return [...record.activities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((activity) => !filters?.entityId || activity.entity.id === filters?.entityId)
  }, [record?.activities, filters?.entityId])

  return {
    activities,
    isLoading,
  }
}

export const storeReceivedActivity = async (
  paradym: ParadymWalletSdk,
  input: {
    entityId?: string
    name?: string
    host?: string
    logo?: DisplayImage
    backgroundColor?: string
    deferredCredentials: CredentialDisplay[]
    status?: ActivityStatus
    credentialIds: CredentialForDisplayId[]
  }
) => {
  await activityStorage.addActivity(paradym.agent, {
    id: utils.uuid(),
    date: new Date().toISOString(),
    type: 'received',
    status: input.status ?? 'success',
    entity: {
      id: input.entityId,
      name: input.name,
      host: input.host,
      logo: input.logo,
      backgroundColor: input.backgroundColor,
    },
    deferredCredentials: input.deferredCredentials,
    credentialIds: input.credentialIds,
  })
}

export const storeSharedOrSignedActivity = async (
  paradym: ParadymWalletSdk,
  input: Omit<PresentationActivity, 'type' | 'date' | 'id'> | Omit<SignedActivity, 'type' | 'date' | 'id'>
) => {
  if ('transaction' in input && input.transaction) {
    await activityStorage.addActivity(paradym.agent, {
      ...input,
      id: utils.uuid(),
      date: new Date().toISOString(),
      type: 'signed',
    })
  } else {
    await activityStorage.addActivity(paradym.agent, {
      ...input,
      id: utils.uuid(),
      date: new Date().toISOString(),
      type: 'shared',
    })
  }
}

export function storeSharedActivityForCredentialsForRequest(
  paradym: ParadymWalletSdk,
  credentialsForRequest: Pick<CredentialsForProofRequest, 'formattedSubmission'> & {
    verifier: Omit<CredentialsForProofRequest['verifier'], 'entityId'> & { entityId?: string }
  },
  status: Exclude<ActivityStatus, 'pending'>,
  transaction?: FormattedTransactionData
) {
  return storeSharedOrSignedActivity(paradym, {
    status,
    entity: {
      id: credentialsForRequest.verifier.entityId,
      host: credentialsForRequest.verifier.hostName,
      name: credentialsForRequest?.verifier.name,
      logo: credentialsForRequest.verifier.logo,
    },
    request: {
      name: credentialsForRequest.formattedSubmission.name,
      purpose: credentialsForRequest.formattedSubmission.purpose,
      credentials: getDisclosedCredentialForSubmission(credentialsForRequest.formattedSubmission),
      failureReason:
        status === 'failed'
          ? !credentialsForRequest.formattedSubmission.areAllSatisfied
            ? 'missing_credentials'
            : 'unknown'
          : undefined,
    },
    transaction,
  })
}

export function storeSharedActivityForSubmission(
  paradym: ParadymWalletSdk,
  submission: FormattedSubmission,
  verifier: {
    id: string
    name?: string
    logo?: DisplayImage
  },
  status: Exclude<ActivityStatus, 'pending'>
) {
  return storeSharedOrSignedActivity(paradym, {
    status,
    entity: {
      id: verifier.id,
      name: verifier.name,
      logo: verifier.logo,
    },
    request: {
      name: submission.name,
      purpose: submission.purpose,
      credentials: getDisclosedCredentialForSubmission(submission),
      failureReason:
        status === 'failed' ? (!submission.areAllSatisfied ? 'missing_credentials' : 'unknown') : undefined,
    },
  })
}

export function getDisclosedCredentialForSubmission(
  formattedSubmission: FormattedSubmission
): Array<PresentationActivityCredentialNotFound | PresentationActivityCredential> {
  return formattedSubmission.entries.map((entry) => {
    if (!entry.isSatisfied) {
      return {
        name: entry.name,
        attributeNames: getUnsatisfiedAttributePathsForDisplay(entry.requestedAttributePaths) as Array<string>,
      } satisfies PresentationActivityCredentialNotFound
    }

    // TODO: once we support selection we should update [0] to the selected credential
    const credential = entry.credentials[0]

    return {
      id: credential.credential.id,
      attributeNames: getDisclosedAttributeNamesForDisplay(credential) as Array<string>,
      attributes: credential.disclosed.attributes,
      metadata: credential.disclosed.metadata as unknown as Record<string, unknown>,
    } satisfies PresentationActivityCredential
  })
}
