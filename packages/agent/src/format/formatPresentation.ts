import {
  ClaimFormat,
  type DcqlQueryResult,
  type DifPexCredentialsForRequest,
  type DifPresentationExchangeDefinitionV2,
  Hasher,
} from '@credo-ts/core'
import { decodeSdJwtVc } from '@credo-ts/core/build/modules/sd-jwt-vc/decodeSdJwtVc'
import { decodeSdJwtSync } from '@sd-jwt/decode'
import { selectDisclosures } from '@sd-jwt/present'

import { JSONPath } from '@astronautlabs/jsonpath'
import type { NonEmptyArray } from '@package/utils'
import {
  type CredentialForDisplay,
  getAttributesAndMetadataForMdocPayload,
  getAttributesAndMetadataForSdJwtPayload,
  getCredentialForDisplay,
  getDisclosedAttributePathArrays,
} from '../display'
import { applyLimitdisclosureForSdJwtRequestedPayload } from './disclosureFrame'

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
    attributes: CredentialForDisplay['attributes']
    metadata: CredentialForDisplay['metadata']

    paths: string[][]
  }
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

  name?: string
  description?: string

  /**
   * Whether the entry is satisfied
   */
  isSatisfied: false

  requestedAttributePaths: Array<Array<string | number | null>>
}

export type FormattedSubmissionEntry = FormattedSubmissionEntryNotSatisfied | FormattedSubmissionEntrySatisfied

export function formatDifPexCredentialsForRequest(
  credentialsForRequest: DifPexCredentialsForRequest,
  definition: DifPresentationExchangeDefinitionV2
): FormattedSubmission {
  const entries = credentialsForRequest.requirements.flatMap((requirement) => {
    // We take the first needsCount entries. Even if not satisfied we will just show these first entries as missing (otherwise it becomes too complex)
    // If selection is possible they can choose alternatives within that (otherwise it becomes too complex)
    const submissionEntries = requirement.submissionEntry.slice(0, requirement.needsCount)

    return submissionEntries.map((submission): FormattedSubmissionEntry => {
      if (submission.verifiableCredentials.length >= 1) {
        return {
          inputDescriptorId: submission.inputDescriptorId,
          name: submission.name,
          description: submission.purpose,
          isSatisfied: true,
          credentials: submission.verifiableCredentials.map(
            (verifiableCredential): FormattedSubmissionEntrySatisfiedCredential => {
              const credentialForDisplay = getCredentialForDisplay(verifiableCredential.credentialRecord)

              // By default the whole credential is disclosed
              let disclosed: FormattedSubmissionEntrySatisfiedCredential['disclosed']
              if (verifiableCredential.type === ClaimFormat.SdJwtVc) {
                const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(
                  verifiableCredential.disclosedPayload
                )
                disclosed = {
                  attributes,
                  metadata,
                  paths: getDisclosedAttributePathArrays(attributes, 2),
                }
              } else if (verifiableCredential.type === ClaimFormat.MsoMdoc) {
                disclosed = {
                  ...getAttributesAndMetadataForMdocPayload(
                    verifiableCredential.disclosedPayload,
                    verifiableCredential.credentialRecord.credential
                  ),
                  paths: getDisclosedAttributePathArrays(verifiableCredential.disclosedPayload, 2),
                }
              } else {
                disclosed = {
                  attributes: credentialForDisplay.attributes,
                  metadata: credentialForDisplay.metadata,
                  paths: getDisclosedAttributePathArrays(credentialForDisplay.attributes, 2),
                }
              }

              return {
                credential: credentialForDisplay,
                disclosed,
              }
            }
          ) as NonEmptyArray<FormattedSubmissionEntrySatisfiedCredential>,
        }
      }

      // Try to determine requested attributes for credential
      const inputDescriptor = definition.input_descriptors.find(({ id }) => id === submission.inputDescriptorId)
      const requestedAttributePaths =
        inputDescriptor?.constraints?.fields
          ?.map((a) =>
            simplifyJsonPath(a.path[0], inputDescriptor.format?.mso_mdoc ? ClaimFormat.MsoMdoc : undefined)?.filter(
              (entry): entry is string => entry !== null
            )
          )
          .filter((path): path is string[] => path !== undefined) ?? []

      const docType = inputDescriptor?.format?.mso_mdoc ? inputDescriptor.id : undefined
      const vctField = inputDescriptor?.format?.['vc+sd-jwt']
        ? inputDescriptor.constraints.fields?.find((field) => field.path.includes('$.vct'))
        : undefined
      const vct = (vctField?.filter?.const ?? vctField?.filter?.enum?.[0]) as string | undefined

      return {
        inputDescriptorId: submission.inputDescriptorId,
        name: requirement.name ?? docType ?? vct?.replace('https://', ''),
        description: requirement.purpose,
        isSatisfied: false,
        requestedAttributePaths: requestedAttributePaths,
      }
    })
  })

  return {
    areAllSatisfied: entries.every((entry) => entry.isSatisfied),
    name: credentialsForRequest.name,
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
          requestedAttributePaths: placeholderCredential.requestedAttributePaths ?? [],
        })
        continue
      }

      const credentialForDisplay = getCredentialForDisplay(match.record)

      let disclosed: FormattedSubmissionEntrySatisfiedCredential['disclosed']
      if (match.output.credentialFormat === 'vc+sd-jwt') {
        if (match.record.type !== 'SdJwtVcRecord') throw new Error('Expected SdJwtRecord')

        if (queryCredential.format !== 'vc+sd-jwt') {
          throw new Error(`Expected queryr credential format ${queryCredential.format} to be vc+sd-jwt`)
        }

        const disclosedDecoded = applyLimitdisclosureForSdJwtRequestedPayload(
          match.record.compactSdJwtVc,
          match.output.claims
        )

        const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(disclosedDecoded.prettyClaims)
        disclosed = {
          attributes,
          metadata,
          paths: getDisclosedAttributePathArrays(attributes, 2),
        }
      } else if (match.output.credentialFormat === 'mso_mdoc') {
        if (match.record.type !== 'MdocRecord') throw new Error('Expected MdocRecord')

        // FIXME: the disclosed payload here doesn't have the correct encoding anymore
        // once we serialize input??
        disclosed = {
          ...getAttributesAndMetadataForMdocPayload(match.output.namespaces, match.record.credential),
          paths: getDisclosedAttributePathArrays(match.output.namespaces, 2),
        }
      } else {
        if (match.record.type !== 'W3cCredentialRecord') throw new Error('Expected W3cCredentialRecord')

        // All paths disclosed for W3C
        disclosed = {
          attributes: credentialForDisplay.attributes,
          metadata: credentialForDisplay.metadata,
          paths: getDisclosedAttributePathArrays(credentialForDisplay.attributes, 2),
        }
      }

      entries.push({
        inputDescriptorId: credentialId,
        credentials: [
          {
            credential: credentialForDisplay,
            disclosed,
          },
        ],
        isSatisfied: true,
        name: credentialForDisplay.display.name,
      })
    }
  }

  return {
    areAllSatisfied: entries.every((entry) => entry.isSatisfied),
    purpose: credentialSets.map((s) => s.purpose).find((purpose): purpose is string => typeof purpose === 'string'),
    entries,
  }
}

function extractCredentialPlaceholderFromQueryCredential(credential: DcqlQueryResult['credentials'][number]) {
  if (credential.format === 'mso_mdoc') {
    return {
      claimFormat: ClaimFormat.MsoMdoc,
      credentialName: credential.meta?.doctype_value ?? 'Unknown',
      requestedAttributePaths: credential.claims?.map((c) => [c.claim_name]),
    }
  }

  if (credential.format === 'vc+sd-jwt') {
    return {
      claimFormat: ClaimFormat.SdJwtVc,
      credentialName: credential.meta?.vct_values?.[0].replace('https://', ''),
      requestedAttributePaths: credential.claims?.map((c) => c.path),
    }
  }

  return {
    claimFormat: ClaimFormat.JwtVc,
    requestedAttributePaths: credential.claims?.map((c) => c.path),
  }
}

/**
 * null means the query should not be rendered
 */
function simplifyJsonPath(path: string, format?: ClaimFormat, filterKeys: string[] = []) {
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

    if (format === ClaimFormat.MsoMdoc) {
      if (parsedPath.length === 3) {
        simplified.push(parsedPath[2].expression.value)
      }
    } else {
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
    }

    if (filterKeys.some((key) => simplified.includes(key))) {
      return null
    }

    return simplified
  } catch (error) {
    return null
  }
}
