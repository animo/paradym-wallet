import {
  ClaimFormat,
  type DcqlQueryResult,
  type MdocNameSpaces,
  MdocRecord,
  type NonEmptyArray,
  SdJwtVcRecord,
  W3cCredentialRecord,
} from '@credo-ts/core'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { getAttributesAndMetadataForSdJwtPayload } from '../display/sdJwt'
import type { CredentialRecord } from '../storage/credentials'
import { formatAttributesWithRecordMetadata, getClaimPathsForMdocNamespaces } from './attributes'
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
 * The claims of a credential as Credo queries them with dcql.
 */
function getDcqlClaimsOfRecord(record: CredentialRecord): unknown {
  if (record instanceof SdJwtVcRecord) return record.firstCredential.prettyClaims
  if (record instanceof MdocRecord) return record.firstCredential.issuerSignedNamespaces
  if (record instanceof W3cCredentialRecord) return record.firstCredential.jsonCredential
  return record.firstCredential.resolvedCredential.toJSON()
}

/**
 * Whether there is a value at a dcql claims path, where `null` stands for any element of an array.
 */
function hasValueAtClaimPath(value: unknown, path: Array<string | number | null>): boolean {
  if (path.length === 0) return value !== undefined && value !== null

  const [segment, ...rest] = path
  if (segment === null) return Array.isArray(value) && value.some((element) => hasValueAtClaimPath(element, rest))
  if (typeof value !== 'object' || value === null) return false

  return hasValueAtClaimPath((value as Record<string | number, unknown>)[segment], rest)
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

    // dcql fails a claim both when the credential lacks it and when its value is not one of the requested
    // values. It holds the claim when there is a value at the claim's path.
    const claimsOfCredential = getDcqlClaimsOfRecord(record)
    const isMismatched = (claimIndex: number) => {
      const claim = queryCredential.claims?.[claimIndex]
      if (!claim?.values) return false

      const path = 'path' in claim ? claim.path : [claim.namespace, claim.claim_name]
      return hasValueAtClaimPath(claimsOfCredential, path)
    }

    const getAttributePaths = (claimIndexes: number[]) =>
      claimIndexes
        .map((claimIndex) => getAttributePathForClaim(queryCredential, claimIndex))
        .filter((path) => path !== undefined)

    partialMatches.set(record.id, {
      credential: getCredentialForDisplay(record),
      missingAttributePaths: getAttributePaths(closestClaimSet.failed_claim_indexes.filter((i) => !isMismatched(i))),
      mismatchedAttributePaths: getAttributePaths(closestClaimSet.failed_claim_indexes.filter(isMismatched)),
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
          const [{ output, disclosed_paths }] = validMatch.claims.valid_claim_sets
          const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(output)

          disclosed = {
            rawAttributes: attributes,
            attributes: formatAttributesWithRecordMetadata(attributes, validMatch.record),
            metadata,
            // The paths Credo discloses, which unlike the output keep an array element at its position
            // in the credential. They include the claims of the JWT itself, which are not attributes.
            paths: (disclosed_paths ?? []).filter(([claim]) => claim in attributes),
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
            paths: getClaimPathsForMdocNamespaces(namespaces),
          }
        } else {
          // All paths disclosed for W3C
          disclosed = {
            rawAttributes: credentialForDisplay.rawAttributes,
            attributes: credentialForDisplay.attributes,
            metadata: credentialForDisplay.metadata,
            paths: Object.keys(credentialForDisplay.rawAttributes).map((claim) => [claim]),
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
