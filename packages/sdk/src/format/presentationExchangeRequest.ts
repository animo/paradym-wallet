import { JSONPath } from '@astronautlabs/jsonpath'
import { ClaimFormat, type DifPexCredentialsForRequest, type DifPresentationExchangeDefinitionV2 } from '@credo-ts/core'
import { getDisclosedAttributePathArrays } from '../display/common'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { getAttributesAndMetadataForSdJwtPayload } from '../display/sdJwt'
import type { NonEmptyArray } from '../types'
import type {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfiedCredential,
} from './submission'

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

        if (entry.expression.type === 'identifier' || entry.expression.type === 'string_literal') {
          // Return the identifier value for normal entries
          simplified.push(value)
        }
      }
    }

    if (filterKeys.some((key) => simplified.includes(key))) {
      return null
    }

    return simplified
  } catch (_error) {
    return null
  }
}

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
              if (verifiableCredential.claimFormat === ClaimFormat.SdJwtDc) {
                const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(
                  verifiableCredential.disclosedPayload
                )
                disclosed = {
                  attributes,
                  metadata,
                  paths: getDisclosedAttributePathArrays(attributes, 2),
                }
              } else if (verifiableCredential.claimFormat === ClaimFormat.MsoMdoc) {
                disclosed = {
                  ...getAttributesAndMetadataForMdocPayload(
                    verifiableCredential.disclosedPayload,
                    verifiableCredential.credentialRecord.firstCredential
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
