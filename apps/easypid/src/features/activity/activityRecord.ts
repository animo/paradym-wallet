import { utils } from '@credo-ts/core'
import type { AppAgent } from '@easypid/agent'
import {
  type CredentialForDisplayId,
  type CredentialsForProofRequest,
  type DisplayImage,
  type FormattedSubmission,
  type FormattedTransactionData,
  getDisclosedAttributeNamesForDisplay,
  getUnsatisfiedAttributePathsForDisplay,
  getWalletJsonStore,
  useWalletJsonRecord,
} from '@package/agent'

import { useMemo } from 'react'

export type ActivityType = 'shared' | 'received' | 'signed'
export type ActivityStatus = 'success' | 'failed' | 'stopped'
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
  id: CredentialForDisplayId
  name?: string
  attributeNames: string[]
  attributes: Record<string, unknown>
  metadata: Record<string, unknown>
}

export interface PresentationActivity extends BaseActivity {
  type: 'shared'
  request: {
    credentials: Array<PresentationActivityCredential | PresentationActivityCredentialNotFound>
    name?: string
    purpose?: string
    failureReason?: SharingFailureReason
  }
}

export interface IssuanceActivity extends BaseActivity {
  type: 'received'
  credentialIds: CredentialForDisplayId[]
}

export interface SignedActivity extends Omit<PresentationActivity, 'type'> {
  type: 'signed'
  transaction: FormattedTransactionData
}

export type Activity = PresentationActivity | IssuanceActivity | SignedActivity

interface ActivityRecord {
  activities: Activity[]
}

const _activityStorage = getWalletJsonStore<ActivityRecord>('EASYPID_ACTIVITY_RECORD')
export const activityStorage = {
  recordId: _activityStorage.recordId,
  addActivity: async (agent: AppAgent, activity: Activity) => {
    // get activity. then add this activity
    const record = await _activityStorage.get(agent)
    if (!record) {
      await _activityStorage.store(agent, {
        activities: [activity],
      })
    } else {
      record.activities.push(activity)
      await _activityStorage.update(agent, record)
    }
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

export const addReceivedActivity = async (
  agent: AppAgent,
  input: {
    entityId?: string
    name: string
    host?: string
    logo?: DisplayImage
    backgroundColor?: string
    credentialIds: CredentialForDisplayId[]
  }
) => {
  await activityStorage.addActivity(agent, {
    id: utils.uuid(),
    date: new Date().toISOString(),
    type: 'received',
    status: 'success',
    entity: {
      id: input.entityId,
      name: input.name,
      host: input.host,
      logo: input.logo,
      backgroundColor: input.backgroundColor,
    },
    credentialIds: input.credentialIds,
  })
}

export const addSharedOrSignedActivity = async (
  agent: AppAgent,
  input: Omit<PresentationActivity, 'type' | 'date' | 'id'> | Omit<SignedActivity, 'type' | 'date' | 'id'>
) => {
  if ('transaction' in input && input.transaction) {
    await activityStorage.addActivity(agent, {
      ...input,
      id: utils.uuid(),
      date: new Date().toISOString(),
      type: 'signed',
    })
  } else {
    await activityStorage.addActivity(agent, {
      ...input,
      id: utils.uuid(),
      date: new Date().toISOString(),
      type: 'shared',
    })
  }
}

export function addSharedActivityForCredentialsForRequest(
  agent: AppAgent,
  credentialsForRequest: Pick<CredentialsForProofRequest, 'formattedSubmission'> & {
    verifier: Omit<CredentialsForProofRequest['verifier'], 'entityId'> & { entityId?: string }
  },
  status: ActivityStatus,
  transaction?: FormattedTransactionData
) {
  return addSharedOrSignedActivity(agent, {
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

export function addSharedActivityForSubmission(
  agent: AppAgent,
  submission: FormattedSubmission,
  verifier: {
    id: string
    name?: string
    logo?: DisplayImage
  },
  status: ActivityStatus
) {
  return addSharedOrSignedActivity(agent, {
    status,
    entity: {
      id: verifier.id,
      name: verifier.name ?? 'Unknown verifier',
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
        attributeNames: getUnsatisfiedAttributePathsForDisplay(entry.requestedAttributePaths),
      } satisfies PresentationActivityCredentialNotFound
    }

    // TODO: once we support selection we should update [0] to the selected credential
    const credential = entry.credentials[0]

    return {
      id: credential.credential.id,
      attributeNames: getDisclosedAttributeNamesForDisplay(credential),
      attributes: credential.disclosed.attributes,
      metadata: credential.disclosed.metadata as unknown as Record<string, unknown>,
    } satisfies PresentationActivityCredential
  })
}
