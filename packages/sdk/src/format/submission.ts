import type { AnonCredsRequestedPredicate } from '@credo-ts/anoncreds'
import type { DifPresentationExchangeDefinitionV2 } from '@credo-ts/core'
import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type { CredentialForDisplay } from '../display/credential'
import { formatDcqlCredentialsForRequest } from './dcqlRequest'
import { formatDifPexCredentialsForRequest } from './presentationExchangeRequest'

export interface FormattedSubmissionEntryNotSatisfied {
  /**
   * can be either:
   *  - AnonCreds groupName
   *  - PEX inputDescriptorId
   *  - DCQL credential query id
   */
  inputDescriptorId: string

  name?: string
  description?: string

  /**
   * Whether the entry is satisfied
   */
  isSatisfied: false

  requestedAttributePaths: Array<Array<string | number | null | AnonCredsRequestedPredicate>>

  /**
   * Credentials of the requested type the wallet does hold, but that cannot answer the entry because
   * some requested attributes are missing from them, or don't have a requested value. Empty when the
   * wallet has no credential of the requested type at all.
   */
  partialMatches: FormattedSubmissionEntryPartialMatch[]
}

export interface FormattedSubmissionEntryPartialMatch {
  credential: CredentialForDisplay

  /**
   * The requested attributes this credential lacks. Uses the same path format as
   * `requestedAttributePaths`.
   */
  missingAttributePaths: FormattedSubmissionEntryNotSatisfied['requestedAttributePaths']

  /**
   * The requested attributes this credential holds, but with a value the request does not accept. Uses
   * the same path format as `requestedAttributePaths`.
   */
  mismatchedAttributePaths: FormattedSubmissionEntryNotSatisfied['requestedAttributePaths']
}

export interface FormattedSubmissionEntrySatisfied {
  /**
   * can be either:
   *  - AnonCreds groupName
   *  - PEX inputDescriptorId
   *  - DCQL credential query id
   */
  inputDescriptorId: string

  name?: string
  description?: string

  /**
   * Whether the entry is satisfied
   */
  isSatisfied: true

  /**
   * Credentials that match the request entry. Wallet always needs to pick one.
   */
  credentials: FormattedSubmissionEntrySatisfiedCredential[]
}

export type FormattedSubmissionEntry = FormattedSubmissionEntryNotSatisfied | FormattedSubmissionEntrySatisfied

export interface FormattedSubmission {
  name?: string
  purpose?: string
  areAllSatisfied: boolean
  entries: FormattedSubmissionEntry[]
}

export interface FormattedSubmissionEntrySatisfiedCredential {
  credential: CredentialForDisplay

  /**
   * If not present the whole credential will be disclosed
   */
  disclosed: {
    rawAttributes: CredentialForDisplay['rawAttributes']
    attributes: CredentialForDisplay['attributes']
    metadata: CredentialForDisplay['metadata']

    /**
     * The paths to the disclosed claims, each with everything below it. An array element has the
     * position it has in the credential. AnonCreds predicates disclose no claim, and are a path of
     * their own.
     */
    paths: (string | number | AnonCredsRequestedPredicate)[][]
  }
}

/**
 * The document to answer when an ISO mdoc request lists several document requests.
 *
 * ISO 18013-5 leaves open whether several DocRequests ask for all of the documents or for any one
 * of them, and iOS presents them as alternatives. The wallet reads them as alternatives on every
 * transport — proximity, and the digital credentials API on both platforms — so a request gets the
 * same answer wherever it comes from: the first document the wallet can share. When it can share
 * none, the entry shown is the one that comes closest: a card missing attributes before no card.
 *
 * @returns the submission narrowed to that one entry, and the index of the entry it was, which is
 * also the index of its document request.
 */
export function selectAlternativeEntry(submission: FormattedSubmission): {
  submission: FormattedSubmission
  entryIndex: number | undefined
} {
  if (submission.entries.length === 0) return { submission, entryIndex: undefined }

  const satisfiedIndex = submission.entries.findIndex((entry) => entry.isSatisfied)
  const partialIndex = submission.entries.findIndex((entry) => !entry.isSatisfied && entry.partialMatches.length > 0)
  const entryIndex = satisfiedIndex !== -1 ? satisfiedIndex : partialIndex !== -1 ? partialIndex : 0
  const entry = submission.entries[entryIndex]

  return {
    submission: { ...submission, entries: [entry], areAllSatisfied: entry.isSatisfied },
    entryIndex,
  }
}

export function getFormattedSubmission(resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest) {
  if (resolvedAuthorizationRequest.presentationExchange) {
    return formatDifPexCredentialsForRequest(
      resolvedAuthorizationRequest.presentationExchange.credentialsForRequest,
      resolvedAuthorizationRequest.presentationExchange.definition as DifPresentationExchangeDefinitionV2
    )
  }

  if (resolvedAuthorizationRequest.dcql) {
    return formatDcqlCredentialsForRequest(resolvedAuthorizationRequest.dcql.queryResult)
  }

  throw new Error('No presentation exchange or dcql found in authorization request.')
}
