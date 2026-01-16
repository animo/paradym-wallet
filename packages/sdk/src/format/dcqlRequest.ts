import { ClaimFormat, type DcqlQueryResult, type MdocNameSpaces, type NonEmptyArray } from '@credo-ts/core'
import { getDisclosedAttributePathArrays } from '../display/common'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { getAttributesAndMetadataForSdJwtPayload } from '../display/sdJwt'
import type {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfiedCredential,
} from './submission'

function extractCredentialPlaceholderFromQueryCredential(credential: DcqlQueryResult['credentials'][number]) {
  if (credential.format === 'mso_mdoc') {
    return {
      claimFormat: ClaimFormat.MsoMdoc,
      credentialName: credential.meta?.doctype_value ?? 'Unknown',
      requestedAttributePaths: credential.claims?.map((c) => ('path' in c ? [c.path[1]] : [c.claim_name])),
    }
  }

  if (credential.format === 'vc+sd-jwt' || credential.format === 'dc+sd-jwt') {
    return {
      claimFormat: ClaimFormat.SdJwtDc,
      credentialName:
        credential.meta && 'vct_values' in credential.meta
          ? credential.meta?.vct_values?.[0].replace('https://', '')
          : undefined,
      requestedAttributePaths: credential.claims?.map((c) => c.path),
    }
  }

  return {
    claimFormat: ClaimFormat.JwtVc,
    requestedAttributePaths: credential.claims?.map((c) => c.path),
  }
}

export function formatDcqlCredentialsForRequest(dcqlQueryResult: DcqlQueryResult): FormattedSubmission {
  const credentialSets: NonNullable<DcqlQueryResult['credential_sets']> = dcqlQueryResult.credential_sets ?? [
    // If no credential sets are defined we create a default one with just all the credential options
    {
      required: true,
      options: [dcqlQueryResult.credentials.map((c) => c.id)],
      matching_options: dcqlQueryResult.can_be_satisfied ? [dcqlQueryResult.credentials.map((c) => c.id)] : undefined,
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

      const credentials: FormattedSubmissionEntrySatisfiedCredential[] = []

      for (const validMatch of match.valid_credentials) {
        const credentialForDisplay = getCredentialForDisplay(validMatch.record)
        let disclosed: FormattedSubmissionEntrySatisfiedCredential['disclosed']

        if (validMatch.record.type === 'SdJwtVcRecord') {
          // Credo already applied selective disclosure on payload
          const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(
            validMatch.claims.valid_claim_sets[0].output
          )
          disclosed = {
            attributes,
            metadata,
            paths: getDisclosedAttributePathArrays(attributes, 2),
          }
        } else if (validMatch.record.type === 'MdocRecord') {
          // TODO: check if fixed now
          // FIXME: the disclosed payload here doesn't have the correct encoding anymore
          // once we serialize input??
          const namespaces = validMatch.claims.valid_claim_sets[0].output as MdocNameSpaces
          disclosed = {
            ...getAttributesAndMetadataForMdocPayload(namespaces, validMatch.record.firstCredential),
            paths: getDisclosedAttributePathArrays(namespaces, 2),
          }
        } else {
          // All paths disclosed for W3C
          disclosed = {
            attributes: credentialForDisplay.attributes,
            metadata: credentialForDisplay.metadata,
            paths: getDisclosedAttributePathArrays(credentialForDisplay.attributes, 2),
          }
        }

        credentials.push({
          credential: credentialForDisplay,
          disclosed,
        })
      }

      entries.push({
        inputDescriptorId: credentialId,
        credentials: credentials as NonEmptyArray<FormattedSubmissionEntrySatisfiedCredential>,
        isSatisfied: true,
        name: credentials[0].credential.display.name,
      })
    }
  }

  return {
    areAllSatisfied: entries.every((entry) => entry.isSatisfied),
    purpose: credentialSets.map((s) => s.purpose).find((purpose): purpose is string => typeof purpose === 'string'),
    entries,
  }
}
