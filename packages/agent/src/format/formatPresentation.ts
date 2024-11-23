import {
  ClaimFormat,
  type DifPexCredentialsForRequest,
  type DcqlQueryResult,
  type DifPresentationExchangeDefinition,
} from '@credo-ts/core'

import {
  filterAndMapSdJwtKeys,
  getCredentialForDisplay,
  recursivelyMapAttribues,
  type CredentialForDisplay,
} from '../display'
import { JSONPath } from '@astronautlabs/jsonpath'
import type { NonEmptyArray } from '@package/utils'
export interface FormattedSubmission {
  name: string
  purpose?: string
  areAllSatisfied: boolean
  entries: FormattedSubmissionEntry[]
}

export interface FormattedSubmissionEntrySatisfiedCredential {
  credential: CredentialForDisplay
  disclosedPayload?: Record<string, unknown>
  requestedAttributes?: string[]
}

export interface FormattedSubmissionEntrySatisfied {
  /**
   * can be either:
   *  - AnonCreds groupName
   *  - PEX inputDescriptorId
   *  - DCQL credential query id
   */
  inputDescriptorId: string

  name: string
  description?: string

  /**
   * Whether the entry is satisfied
   */
  isSatisfied: true

  /**
   * Credentials that match the request entry. Wallet always needs to pick one.
   */
  credentials: [FormattedSubmissionEntrySatisfiedCredential, ...FormattedSubmissionEntrySatisfiedCredential[]]
}

export interface FormattedSubmissionEntryNotSatisfied {
  /**
   * can be either:
   *  - AnonCreds groupName
   *  - PEX inputDescriptorId
   *  - DCQL credential query id
   */
  inputDescriptorId: string

  name: string
  description?: string

  /**
   * Whether the entry is satisfied
   */
  isSatisfied: false

  requestedAttributes: string[]
}

export type FormattedSubmissionEntry = FormattedSubmissionEntryNotSatisfied | FormattedSubmissionEntrySatisfied

export function formatDifPexCredentialsForRequest(
  credentialsForRequest: DifPexCredentialsForRequest,
  definition: DifPresentationExchangeDefinition
): FormattedSubmission {
  const entries = credentialsForRequest.requirements.flatMap((requirement) => {
    // We take the first needsCount entries. Even if not satisfied we will just show these first entries as missing (otherwise it becomes too complex)
    // If selection is possible they can choose alternatives within that (otherwise it becomes too complex)
    const submissionEntries = requirement.submissionEntry.slice(0, requirement.needsCount)

    return submissionEntries.map((submission): FormattedSubmissionEntry => {
      if (submission.verifiableCredentials.length >= 1) {
        return {
          inputDescriptorId: submission.inputDescriptorId,
          name: submission.name ?? 'Unknown',
          description: submission.purpose,
          isSatisfied: true,
          credentials: submission.verifiableCredentials.map((verifiableCredential) => {
            // FIXME: this should also just return the correct branding for the PID already.
            // Will solve a lot of complexity
            const credentialForDisplay = getCredentialForDisplay(verifiableCredential.credentialRecord)

            let disclosedPayload = credentialForDisplay.attributes
            if (verifiableCredential.type === ClaimFormat.SdJwtVc) {
              disclosedPayload = filterAndMapSdJwtKeys(verifiableCredential.disclosedPayload).visibleProperties
            } else if (verifiableCredential.type === ClaimFormat.MsoMdoc) {
              disclosedPayload = Object.fromEntries(
                Object.values(verifiableCredential.disclosedPayload).flatMap((entry) =>
                  Object.entries(entry).map(([key, value]) => [key, recursivelyMapAttribues(value)])
                )
              )
            }

            return {
              credential: credentialForDisplay,
              disclosedPayload,
              requestedAttributes: [...Object.keys(disclosedPayload)],
            }
          }) as NonEmptyArray<FormattedSubmissionEntrySatisfiedCredential>,
        }
      }

      // Try to determine requested attributes for credential
      const inputDescriptor = definition.input_descriptors.find(({ id }) => id === submission.inputDescriptorId)
      const requestedAttriutes =
        inputDescriptor?.constraints?.fields
          ?.map((a) =>
            simplifyJsonPath(a.path[0])
              ?.filter((entry): entry is string => entry !== null)
              .join(' ')
          )
          .filter((path): path is string => path !== undefined) ?? []

      return {
        inputDescriptorId: submission.inputDescriptorId,
        name: submission.name ?? 'Unknown',
        description: submission.purpose,
        isSatisfied: false,
        requestedAttributes: requestedAttriutes,
      }
    })
  })

  return {
    areAllSatisfied: entries.every((entry) => entry.isSatisfied),
    name: credentialsForRequest.name ?? 'Unknown',
    purpose: credentialsForRequest.purpose,
    entries,
  }
}

export function formatDcqlCredentialsForRequest(dcqlQueryResult: DcqlQueryResult): FormattedSubmission {
  const credentialSets: NonNullable<DcqlQueryResult['credential_sets']> = dcqlQueryResult.credential_sets ?? [
    // If no credential sets are defined we create a default one with just all the credential options
    {
      required: true,
      options: [dcqlQueryResult.credentials.map((c) => c.id)],
      matching_options: dcqlQueryResult.canBeSatisfied ? [dcqlQueryResult.credentials.map((c) => c.id)] : undefined,
    },
  ]

  const entries: FormattedSubmissionEntry[] = []
  for (const credentialSet of credentialSets) {
    // Take first matching option, otherwise take first option
    for (const credentialId of credentialSet.matching_options?.[0] ?? credentialSet.options[0]) {
      const match = dcqlQueryResult.credential_matches[credentialId]
      const queryCredential = dcqlQueryResult.credentials.find((c) => c.id === credentialId)
      if (!queryCredential) {
        throw new Error(`Credential '${credentialId}' not found in dcql query`)
      }

      if (!match || !match.success) {
        const placeholderCredential = extractCredentialPlaceholderFromQueryCredential(queryCredential)
        entries.push({
          isSatisfied: false,
          inputDescriptorId: credentialId,
          name: placeholderCredential.credentialName,
          requestedAttributes: placeholderCredential.requestedAttributes ?? [],
        })
        continue
      }

      // FIXME: this should also just return the correct branding for the PID already.
      // Will solve a lot of complexity
      const credentialForDisplay = getCredentialForDisplay(match.record)

      let disclosedPayload = credentialForDisplay.attributes
      if (match.success && 'vct' in match.output) {
        // FIXME: SD-JWT selective disclosure is NOT applied here, we should create a presentation frame based on this, or better
        // if the credo layer for DCQL handles this.
        disclosedPayload = filterAndMapSdJwtKeys(match.output.claims).visibleProperties
      } else if (match.success && 'namespaces' in match.output) {
        disclosedPayload = Object.fromEntries(
          Object.values(match.output.namespaces).flatMap((entry) =>
            Object.entries(entry).map(([key, value]) => [key, recursivelyMapAttribues(value)])
          )
        )
      }

      entries.push({
        inputDescriptorId: credentialId,
        credentials: [
          {
            credential: credentialForDisplay,
            disclosedPayload,
            requestedAttributes: Object.keys(disclosedPayload),
          },
        ],
        isSatisfied: true,
        name: credentialForDisplay.display.name,
      })
    }
  }

  return {
    areAllSatisfied: entries.every((entry) => entry.isSatisfied),
    // TOOD:
    name: '',
    purpose: credentialSets.map((s) => s.purpose).find((purpose): purpose is string => typeof purpose === 'string'),
    entries,
  }
}

function extractCredentialPlaceholderFromQueryCredential(credential: DcqlQueryResult['credentials'][number]) {
  if (credential.format === 'mso_mdoc') {
    return {
      claimFormat: ClaimFormat.MsoMdoc,
      credentialName: `${credential.meta?.doctype_value}` ?? 'Unknown',
      requestedAttributes: credential.claims?.map((c) => c.claim_name),
    }
  }

  if (credential.format === 'vc+sd-jwt') {
    return {
      claimFormat: ClaimFormat.SdJwtVc,
      credentialName: `${credential.meta?.vct_values?.[0]}` ?? 'Unknown',
      requestedAttributes: credential.claims?.map((c) => c.path.join('.')),
    }
  }

  return {
    claimFormat: ClaimFormat.JwtVc,
    credentialName: 'Unknown',
    requestedAttributes: credential.claims?.map((c) => c.path.join('.')),
  }
}

/**
 * null means the query should not be rendered
 */
function simplifyJsonPath(path: string, filterKeys: string[] = []) {
  try {
    const parsedPath: Array<{
      scope: string
      operation: string
      expression: { type: string; value: string; [key: string]: unknown }
    }> = JSONPath.parse(path)

    if (!Array.isArray(parsedPath)) {
      return null
    }

    const simplified: Array<string | null> = []

    for (const entry of parsedPath) {
      // Skip entries we want to remove
      const value = entry.expression.value
      if (['vc', 'vp', 'credentialSubject'].includes(value)) {
        continue
      }

      // Remove root
      if (entry.expression.type === 'root') {
        continue
      }

      if (
        entry.expression.type === 'wildcard' ||
        (entry.expression.type === 'numeric_literal' && !Number.isNaN(value))
      ) {
        // Replace wildcards and numeric indices with null
        simplified.push(null)
      }

      if (entry.expression.type === 'identifier') {
        // Return the identifier value for normal entries
        simplified.push(value)
      }
    }

    if (filterKeys.some((key) => simplified.includes(key))) {
      return null
    }

    return simplified
  } catch (error) {
    return null
  }
}
