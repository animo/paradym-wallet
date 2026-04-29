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
  credentialSets?: FormattedSubmissionCredentialSet[]
}

export interface FormattedSubmissionCredentialSet {
  id: string
  description?: string
  required: boolean
  slots: FormattedSubmissionCredentialSlot[]
}

export interface FormattedSubmissionCredentialSlot {
  id: string
  optional: boolean
  alternatives: FormattedSubmissionCredentialAlternative[]
}

export interface FormattedSubmissionCredentialAlternative {
  inputDescriptorId: string
  name?: string
  credentials: FormattedSubmissionEntrySatisfiedCredential[]
  transactionData?: FormattedSubmissionTransactionData
  transactionDataByCredentialId?: Record<string, FormattedSubmissionTransactionData>
}

export interface FormattedSubmissionTransactionData {
  index: number
  type: string
  title?: string
  securityHint?: string
  affirmativeActionLabel?: string
  denialActionLabel?: string
  claims: Array<{
    label: string
    value: string
  }>
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

    paths: (string | AnonCredsRequestedPredicate)[][]
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
    return formatDcqlCredentialsForRequest(resolvedAuthorizationRequest.dcql.queryResult, {
      dcqlQuery: resolvedAuthorizationRequest.authorizationRequestPayload.dcql_query,
      transactionData: resolvedAuthorizationRequest.authorizationRequestPayload.transaction_data,
    })
  }

  throw new Error('No presentation exchange or dcql found in authorization request.')
}
