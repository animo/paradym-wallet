import { ClaimFormat, type DcqlQueryResult, type MdocNameSpaces, type NonEmptyArray } from '@credo-ts/core'
import { getDisclosedAttributePathArrays } from '../display/common'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { getAttributesAndMetadataForSdJwtPayload } from '../display/sdJwt'
import { formatAttributesWithRecordMetadata } from './attributes'
import type {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntryPartialMatch,
  FormattedSubmissionEntrySatisfiedCredential,
} from './submission'

type DcqlQueryCredential = DcqlQueryResult['credentials'][number]

/**
 * The path the share UI shows for a claim query: the element identifier for mdoc, the claim path
 * otherwise. Requested and missing attributes both go through here, so they can be compared.
 */
function getAttributePathForClaim(credential: DcqlQueryCredential, claimIndex: number) {
  if (credential.format === 'mso_mdoc') {
    const claim = credential.claims?.[claimIndex]
    if (!claim) return undefined
    return 'path' in claim ? [claim.path[1]] : [claim.claim_name]
  }

  return credential.claims?.[claimIndex]?.path
}

function extractCredentialPlaceholderFromQueryCredential(credential: DcqlQueryCredential) {
  const requestedAttributePaths = credential.claims
    ?.map((_, index) => getAttributePathForClaim(credential, index))
    .filter((path) => path !== undefined)

  if (credential.format === 'mso_mdoc') {
    return {
      claimFormat: ClaimFormat.MsoMdoc,
      credentialName: credential.meta?.doctype_value ?? 'Unknown',
      requestedAttributePaths,
    }
  }

  if (
    (credential.format === 'vc+sd-jwt' && credential.meta && 'vct_values' in credential.meta) ||
    credential.format === 'dc+sd-jwt'
  ) {
    return {
      claimFormat: ClaimFormat.SdJwtDc,
      credentialName:
        credential.meta && 'vct_values' in credential.meta
          ? credential.meta?.vct_values?.[0].replace('https://', '')
          : undefined,
      requestedAttributePaths,
    }
  }

  return {
    claimFormat: ClaimFormat.JwtVc,
    requestedAttributePaths,
  }
}

/**
 * Credentials of the requested type that fail the query on their claims. A credential of another
 * type is a different card altogether, not a partial match. Whether the issuer is one the verifier
 * accepts (`trusted_authorities`) is not considered: the card still lacks what is asked for.
 */
function getPartialMatches(
  queryCredential: DcqlQueryCredential,
  match: DcqlQueryResult['credential_matches'][string] | undefined
): FormattedSubmissionEntryPartialMatch[] {
  const partialMatches = new Map<string, FormattedSubmissionEntryPartialMatch>()

  for (const failedCredential of match?.failed_credentials ?? []) {
    const { meta, claims, record } = failedCredential
    if (!meta.success || claims.success) continue
    // An SD-JWT VC is queried once for every format and vct it can be presented as.
    if (partialMatches.has(record.id)) continue

    // The claim set that comes closest to being satisfied.
    const [closestClaimSet] = [...claims.failed_claim_sets].sort(
      (a, b) => a.failed_claim_indexes.length - b.failed_claim_indexes.length
    )

    partialMatches.set(record.id, {
      credential: getCredentialForDisplay(record),
      missingAttributePaths: closestClaimSet.failed_claim_indexes
        .map((claimIndex) => getAttributePathForClaim(queryCredential, claimIndex))
        .filter((path) => path !== undefined),
    })
  }

  return Array.from(partialMatches.values())
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

      if (!match?.success) {
        const placeholderCredential = extractCredentialPlaceholderFromQueryCredential(queryCredential)
        entries.push({
          isSatisfied: false,
          inputDescriptorId: credentialId,
          name: placeholderCredential.credentialName,
          requestedAttributePaths: placeholderCredential.requestedAttributePaths ?? [],
          partialMatches: getPartialMatches(queryCredential, match),
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
            rawAttributes: attributes,
            attributes: formatAttributesWithRecordMetadata(attributes, validMatch.record),
            metadata,
            paths: getDisclosedAttributePathArrays(attributes, 2),
          }
        } else if (validMatch.record.type === 'MdocRecord') {
          const namespaces = validMatch.claims.valid_claim_sets[0].output as MdocNameSpaces
          const { attributes, metadata } = getAttributesAndMetadataForMdocPayload(
            namespaces,
            validMatch.record.firstCredential
          )

          disclosed = {
            metadata,
            rawAttributes: attributes,
            attributes: formatAttributesWithRecordMetadata(attributes, validMatch.record),
            paths: getDisclosedAttributePathArrays(namespaces, 2),
          }
        } else {
          // All paths disclosed for W3C
          disclosed = {
            rawAttributes: credentialForDisplay.rawAttributes,
            attributes: credentialForDisplay.attributes,
            metadata: credentialForDisplay.metadata,
            paths: getDisclosedAttributePathArrays(credentialForDisplay.rawAttributes, 2),
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
