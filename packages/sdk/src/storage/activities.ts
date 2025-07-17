import { utils } from '@credo-ts/core'
import type { BaseAgent } from '../agent'
import { getDisclosedAttributeNamesForDisplay, getUnsatisfiedAttributePathsForDisplay } from '../display/common'
import type { DisplayImage } from '../display/credential'
import type { FormattedSubmission } from '../format/submission'
import type { CredentialId } from '../hooks/useCredentialById'
import type { CredentialsForProofRequest } from '../openid4vc/getCredentialsForProofRequest'
import type { FormattedTransactionData } from '../openid4vc/transaction'
import { getWalletJsonStore } from './walletJsonStore'

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
  id: CredentialId
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
  credentialIds: CredentialId[]
}

export interface SignedActivity extends Omit<PresentationActivity, 'type'> {
  type: 'signed'
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
  addActivity: async (agent: BaseAgent, activity: Activity) => {
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
  },
}

export const addReceivedActivity = async (
  agent: BaseAgent,
  input: {
    entityId?: string
    name: string
    host?: string
    logo?: DisplayImage
    backgroundColor?: string
    credentialIds: CredentialId[]
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
  agent: BaseAgent,
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
  agent: BaseAgent,
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
  agent: BaseAgent,
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
