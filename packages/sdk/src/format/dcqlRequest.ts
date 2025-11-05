import { ClaimFormat, type DcqlQueryResult } from '@credo-ts/core'
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
      if (match.output.credential_format === 'vc+sd-jwt' || match.output.credential_format === 'dc+sd-jwt') {
        if (match.record.type !== 'SdJwtVcRecord') throw new Error('Expected SdJwtRecord')

        if (queryCredential.format !== 'vc+sd-jwt' && queryCredential.format !== 'dc+sd-jwt') {
          throw new Error(`Expected queryr credential format ${queryCredential.format} to be vc+sd-jwt or dc+sd-jwt`)
        }

        // Creod already applied selective disclosure on payload
        const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(match.output.claims)
        disclosed = {
          attributes,
          metadata,
          paths: getDisclosedAttributePathArrays(attributes, 2),
        }
      } else if (match.output.credential_format === 'mso_mdoc') {
        if (match.record.type !== 'MdocRecord') throw new Error('Expected MdocRecord')

        // TODO: check if fixed now
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
