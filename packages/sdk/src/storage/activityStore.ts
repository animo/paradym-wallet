import type { Agent } from '@credo-ts/core'
import { utils } from '@credo-ts/core'
import { getDisclosedAttributeNamesForDisplay, getUnsatisfiedAttributePathsForDisplay } from '../display/common'
import type { CredentialDisplay, CredentialForDisplayId, DisplayImage } from '../display/credential'
import type { ClaimPath } from '../format/attributes'
import type { FormattedSubmission } from '../format/submission'
import type { CredentialsForProofRequest } from '../openid4vc/func/resolveCredentialRequest'
import type {
  FormattedTransactionData,
  FormattedTransactionDataPaymentSingle,
  FormattedTransactionDataQesAuthorization,
} from '../openid4vc/transaction'
import { pasoPaymentTransactionDataType } from '../paso/paymentRulebook'
import type { FormattedTransactionDataPasoPayment } from '../paso/transactionData'
import {
  deleteActivityRecord,
  getActivityRecordById,
  saveActivityRecord,
  saveActivityRecords,
  updateActivityRecord,
} from './activityRecords'
import { upgradeLegacyActivity } from './activityUpgrade'
import { getWalletJsonStore } from './walletJsonStore'

export type ActivityType = 'shared' | 'received' | 'signed' | 'payment'
export type ActivityStatus = 'success' | 'failed' | 'stopped' | 'pending'
export type SharingFailureReason = 'missing_credentials' | 'unknown'
export type PaymentTransactionStatusCode = 'RJCT' | 'PDNG' | 'ACSC'

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

/**
 * A shared credential, recorded as which fields were disclosed rather than what they contained.
 *
 * The activity log answers "which fields you disclosed, to whom, when"; the values themselves live
 * in the credential, which `id` links to. Storing them here made every presentation append its
 * disclosed payload — an mDL portrait included — to a record the wallet reads whole on startup.
 *
 * Paths rather than labels, so the names follow the language the user is reading in now instead of
 * the one that happened to be active when the credential was shared.
 */
export type PresentationActivityCredential = {
  version: 'v3'
  id: CredentialForDisplayId
  name?: string
  paths: ClaimPath[]

  /**
   * The names those paths resolved to when the credential was shared, in whatever language the user
   * was reading at the time.
   *
   * A fallback, not the source of truth: while the credential is still in the wallet the names are
   * resolved from {@link paths} against it, so they follow the current language. Once it has been
   * deleted there is nothing left to resolve against, and these are all that is left to show. They
   * are stored because they are a handful of short strings — unlike the values, which is what made
   * the log expensive to keep.
   */
  attributeNames: string[]
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
  transaction: FormattedTransactionDataQesAuthorization
}

export interface PaymentActivity extends Omit<PresentationActivity, 'type'> {
  type: 'payment'
  status: Exclude<ActivityStatus, 'pending'>
  /** A TS 12 `payment:single:1` or a PaSO `global:payment:1` transaction. */
  transaction: FormattedTransactionDataPaymentSingle | FormattedTransactionDataPasoPayment
  transactionStatus?: PaymentTransactionStatusCode
}

export type Activity = PresentationActivity | IssuanceActivity | SignedActivity | PaymentActivity

/**
 * The settlement status to show for an activity, where the wallet has one to show.
 *
 * Two different things get called the status of a payment, and they are not interchangeable:
 * `activity.status` is whether the *sharing* succeeded, which the wallet witnessed, while
 * `transactionStatus` is whether the *payment* settled, which only the Attestation Provider knows and
 * only tells us through the TS 12 status backchannel.
 *
 * PaSO defines no such backchannel, so for a PaSO payment the wallet has no way to learn it and
 * returns `undefined` rather than a guess. Older PaSO activities may still carry a `PDNG` that an
 * earlier version wrote at creation time — nothing can ever move it off pending, so it is not shown.
 *
 * Every surface that displays a payment reads this, so the list and the detail screen cannot drift
 * apart on what the same activity means.
 */
export function getPaymentTransactionStatus(activity: Activity): PaymentTransactionStatusCode | undefined {
  if (activity.type !== 'payment') return undefined

  // A share that did not complete never reached the Relying Party, so there is nothing to settle and
  // nothing to report. Declining a TS 12 payment still records the `PDNG` its activity was created
  // with, which would otherwise show a payment the user refused as pending forever.
  if (activity.status !== 'success') return undefined

  if (activity.transaction.type === pasoPaymentTransactionDataType) return undefined

  return activity.transactionStatus
}

/**
 * What writing an activity needs.
 *
 * Structural rather than the full SDK, because the credential request UI answers requests from its
 * own process with {@link import('../dcApi/ParadymDcApiSdk').ParadymDcApiSdk} — a wallet with none
 * of issuance, didcomm or the app's UI stack, but the same store underneath.
 */
export type ActivityWriter = { agent: Agent }

export type ActivityRecord = {
  activities: Activity[]
}

/**
 * Where the whole history used to live, as one record.
 *
 * Only read now, and only by {@link migrateActivities}, which fans it out into a record per
 * activity and then removes it.
 */
const legacyActivityStorage = getWalletJsonStore<ActivityRecord>('EASYPID_ACTIVITY_RECORD')

let migration: Promise<void> | undefined

/**
 * Move a single-record history into a record per activity, once.
 *
 * Memoised rather than guarded by a flag in storage, because the flag would have to be written
 * before the work it describes is finished. Re-running it is safe instead: every write is an
 * upsert, and the record it reads from is removed only once everything else is in place.
 */
export function migrateActivities(agent: Agent): Promise<void> {
  migration ??= (async () => {
    const legacy = await legacyActivityStorage.get(agent)
    if (!legacy) return

    // Upgraded as they are moved, so none of them is stored with the values it disclosed again. The
    // index is written once all records are saved, so an interrupted run adds none of them to it.
    const activities = []
    for (const activity of legacy.activities) {
      activities.push(await upgradeLegacyActivity(agent, activity))
    }

    await saveActivityRecords(agent, activities)

    // Last, and only once every activity has a record of its own: until this happens the old record
    // is still the source of truth, and the migration can simply run again.
    await agent.genericRecords.deleteById(legacyActivityStorage.recordId)
  })()

  return migration
}

export const activityStorage = {
  addActivity: async (agent: Agent, activity: Activity) => {
    await saveActivityRecord(agent, activity)
    return activity
  },
  deleteActivity: async (agent: Agent, id: string) => {
    await deleteActivityRecord(agent, id)
  },
  updateActivity: async (agent: Agent, id: string, update: Partial<Activity>) => {
    const activity = await getActivityRecordById(agent, id)
    if (!activity) throw new Error(`Activity ${id} not found`)

    const updated = { ...activity, ...update } as Activity
    await updateActivityRecord(agent, updated)

    return updated
  },
}

export const storeReceivedActivity = async (
  paradym: ActivityWriter,
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
  paradym: ActivityWriter,
  input:
    | Omit<PresentationActivity, 'type' | 'date' | 'id'>
    | Omit<SignedActivity, 'type' | 'date' | 'id'>
    | Omit<PaymentActivity, 'type' | 'date' | 'id'>
): Promise<Activity> => {
  if ('transaction' in input && input.transaction) {
    const transaction = input.transaction
    if (transaction.type === 'qes_authorization') {
      return activityStorage.addActivity(paradym.agent, {
        ...input,
        transaction,
        id: utils.uuid(),
        date: new Date().toISOString(),
        type: 'signed',
      })
    }
    return activityStorage.addActivity(paradym.agent, {
      // Only TS 12 defines a transaction status backchannel, so only a TS 12 payment starts out
      // "pending". A PaSO payment whose Attestation Provider happens to offer the same extension
      // picks up its first status from the poll that follows; one that does not would otherwise show
      // as pending forever, which is a claim about the payment that nothing can ever settle.
      ...(transaction.type === 'urn:eudi:sca:eu.europa.ec:payment:single:1'
        ? { transactionStatus: 'PDNG' as const }
        : {}),
      ...input,
      transaction,
      id: utils.uuid(),
      date: new Date().toISOString(),
      type: 'payment',
    })
  }
  return activityStorage.addActivity(paradym.agent, {
    ...input,
    id: utils.uuid(),
    date: new Date().toISOString(),
    type: 'shared',
  })
}

export function storeSharedActivityForCredentialsForRequest(
  paradym: ActivityWriter,
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
  paradym: ActivityWriter,
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
        attributeNames: getUnsatisfiedAttributePathsForDisplay(entry.requestedAttributePaths),
      } satisfies PresentationActivityCredentialNotFound
    }

    // TODO: once we support selection we should update [0] to the selected credential
    const credential = entry.credentials[0]

    const paths = credential.disclosed.paths as ClaimPath[]

    return {
      id: credential.credential.id,
      version: 'v3',
      name: credential.credential.display.name,
      paths,
      // The names on the card that was shared, for once the credential is gone
      attributeNames: getDisclosedAttributeNamesForDisplay(credential).filter((name) => typeof name === 'string'),
    } satisfies PresentationActivityCredential
  })
}
