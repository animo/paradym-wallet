import type {
  DcqlCredentialQuery,
  DcqlQuery,
  ResolvedDcqlResult,
  TransactionDataInput,
} from '@animo-id/eudi-wallet-ts12-dcql'
import { ClaimFormat, type JsonObject, type MdocNameSpaces, type NonEmptyArray } from '@credo-ts/core'
import { getDisclosedAttributePathArrays } from '../display/common'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { getAttributesAndMetadataForSdJwtPayload } from '../display/sdJwt'
import { formatResolvedTransactionData } from '../openid4vc/transactionDataRegistry'
import type { CredentialRecord } from '../storage/credentials'
import { formatAttributesWithRecordMetadata } from './attributes'
import type {
  FormattedSubmission,
  FormattedSubmissionCredentialAlternative,
  FormattedSubmissionCredentialSet,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfiedCredential,
} from './submission'

export type DcqlSubmissionCredential = {
  record: CredentialRecord
  claims: {
    valid_claim_sets: NonEmptyArray<{ output: Record<string, unknown> }>
  }
}

function extractCredentialPlaceholderFromQueryCredential(credential: DcqlCredentialQuery) {
  const typeValues = credential.meta && 'type_values' in credential.meta ? credential.meta.type_values : undefined
  const type = Array.isArray(typeValues) ? typeValues[0]?.[0] : undefined

  if (credential.format === 'mso_mdoc') {
    return {
      claimFormat: ClaimFormat.MsoMdoc,
      credentialName:
        credential.meta && 'doctype_value' in credential.meta ? String(credential.meta.doctype_value) : 'Unknown',
      requestedAttributePaths: credential.claims?.map((claim) => claim.path),
    }
  }

  if (credential.format === 'jwt_vc_json' || credential.format === 'ldp_vc') {
    return {
      claimFormat: credential.format === 'ldp_vc' ? ClaimFormat.LdpVc : ClaimFormat.JwtVc,
      credentialName: typeof type === 'string' ? type.replace('https://', '') : undefined,
      requestedAttributePaths: credential.claims?.map((claim) => claim.path),
    }
  }

  if (credential.format === 'vc+sd-jwt' && type) {
    return {
      claimFormat: ClaimFormat.SdJwtW3cVc,
      credentialName: type.replace('https://', ''),
      requestedAttributePaths: credential.claims?.map((claim) => claim.path),
    }
  }

  if (credential.format === 'vc+sd-jwt' || credential.format === 'dc+sd-jwt') {
    const vctValues = credential.meta && 'vct_values' in credential.meta ? credential.meta.vct_values : undefined
    const vct = Array.isArray(vctValues) ? vctValues[0] : undefined

    return {
      claimFormat: ClaimFormat.SdJwtDc,
      credentialName: typeof vct === 'string' ? vct.replace('https://', '') : undefined,
      requestedAttributePaths: credential.claims?.map((claim) => claim.path),
    }
  }

  return {
    claimFormat: ClaimFormat.JwtVc,
    requestedAttributePaths: credential.claims?.map((claim) => claim.path),
  }
}

function formatCredentialForSubmission(validMatch: DcqlSubmissionCredential) {
  const credentialForDisplay = getCredentialForDisplay(validMatch.record)
  let disclosed: FormattedSubmissionEntrySatisfiedCredential['disclosed']

  if (validMatch.record.type === 'MdocRecord') {
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
  } else if (validMatch.record.type === 'SdJwtVcRecord') {
    const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(
      validMatch.claims.valid_claim_sets[0].output as JsonObject
    )

    disclosed = {
      rawAttributes: attributes,
      attributes: formatAttributesWithRecordMetadata(attributes, validMatch.record),
      metadata,
      paths: getDisclosedAttributePathArrays(attributes, 2),
    }
  } else {
    const rawAttributes = validMatch.claims.valid_claim_sets[0].output

    disclosed = {
      rawAttributes,
      attributes: formatAttributesWithRecordMetadata(rawAttributes, validMatch.record),
      metadata: credentialForDisplay.metadata,
      paths: getDisclosedAttributePathArrays(rawAttributes, 2),
    }
  }

  return {
    credential: credentialForDisplay,
    disclosed,
  }
}

function formatResolvedCredentialForSubmission(
  credentialQueryId: string,
  credential: { credentialId: string },
  credentialsByQuery: Map<string, DcqlSubmissionCredential[]>
) {
  const validCredential = credentialsByQuery
    .get(credentialQueryId)
    ?.find(({ record }) => record.id === credential.credentialId)

  return validCredential ? formatCredentialForSubmission(validCredential) : undefined
}

function stringifyDebugValue(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function getCredentialQueryDebugMessage(queryCredential: DcqlCredentialQuery | undefined, credentialName?: string) {
  if (!queryCredential) return undefined

  return [
    `Credential query id: ${queryCredential.id}`,
    credentialName ? `Credential name: ${credentialName}` : undefined,
    `Format: ${queryCredential.format}`,
    `Meta: ${stringifyDebugValue(queryCredential.meta)}`,
    `Claims: ${stringifyDebugValue(queryCredential.claims ?? [])}`,
  ]
    .filter((line): line is string => !!line)
    .join('\n')
}

function getMissingCredentialError(queryCredential: DcqlCredentialQuery | undefined, credentialName?: string) {
  return {
    type: 'missing_credential' as const,
    message: 'Credential missing',
    debugMessage: getCredentialQueryDebugMessage(queryCredential, credentialName),
  }
}

function getCredentialNamesForQuery(
  credentialQueryId: string,
  credentialsByQuery: Map<string, DcqlSubmissionCredential[]>
) {
  return Array.from(
    new Set(
      credentialsByQuery
        .get(credentialQueryId)
        ?.map((credential) => getCredentialForDisplay(credential.record).display.name)
        .filter((name): name is string => typeof name === 'string' && name.length > 0) ?? []
    )
  )
}

function getUnsupportedTransactionDataError(
  credentialQueryId: string,
  transactionData: TransactionDataInput[],
  queryCredential?: DcqlCredentialQuery,
  credentialName?: string,
  matchingCredentialNames: string[] = []
) {
  const targetedTransactionData = transactionData.find((entry) => entry.credential_ids.includes(credentialQueryId))
  if (!targetedTransactionData) return undefined

  const requiredCredential =
    matchingCredentialNames.length > 0 ? matchingCredentialNames.join(', ') : (credentialName ?? credentialQueryId)

  return {
    type: 'unsupported_transaction_data',
    message: 'Unsupported transaction data',
    transactionDataType: targetedTransactionData.type,
    requiredCredential,
    credentialQueryId,
    debugMessage: [
      `Transaction data type: ${targetedTransactionData.type}`,
      `Targeted credential query id: ${credentialQueryId}`,
      matchingCredentialNames.length > 0
        ? `Credentials matching request before transaction-data filtering: ${matchingCredentialNames.join(', ')}`
        : undefined,
      getCredentialQueryDebugMessage(queryCredential, credentialName),
      `Transaction payload: ${stringifyDebugValue(targetedTransactionData.payload)}`,
    ]
      .filter((line): line is string => !!line)
      .join('\n'),
  } as const
}

function getFormattedCredentialsForQuery(
  credentialQueryId: string,
  credentialSets: FormattedSubmissionCredentialSet[]
) {
  return credentialSets.flatMap((credentialSet) =>
    credentialSet.slots.flatMap((slot) =>
      slot.alternatives.flatMap((alternative) =>
        alternative.inputDescriptorId === credentialQueryId ? alternative.credentials : []
      )
    )
  )
}

function formatSubmissionEntry(
  queryCredential: DcqlCredentialQuery,
  credentialSets: FormattedSubmissionCredentialSet[]
): FormattedSubmissionEntry {
  const credentials = getFormattedCredentialsForQuery(queryCredential.id, credentialSets)

  if (credentials.length === 0) {
    const placeholderCredential = extractCredentialPlaceholderFromQueryCredential(queryCredential)

    return {
      isSatisfied: false,
      inputDescriptorId: queryCredential.id,
      name: placeholderCredential.credentialName,
      requestedAttributePaths: placeholderCredential.requestedAttributePaths ?? [],
    }
  }

  return {
    inputDescriptorId: queryCredential.id,
    credentials: credentials as NonEmptyArray<FormattedSubmissionEntrySatisfiedCredential>,
    isSatisfied: true,
    name: credentials[0].credential.display.name,
  }
}

function areCredentialSetsSatisfied(credentialSets: FormattedSubmissionCredentialSet[]) {
  return credentialSets.every(
    (credentialSet) =>
      !credentialSet.required ||
      credentialSet.slots.every(
        (slot) =>
          slot.optional ||
          slot.alternatives.some(
            (alternative) =>
              alternative.credentials.length > 0 && !alternative.error && !alternative.transactionDataError
          )
      )
  )
}

function formatCredentialSets({
  dcqlQuery,
  resolvedDcql,
  credentialsByQuery,
  transactionData,
}: {
  dcqlQuery: DcqlQuery
  resolvedDcql: ResolvedDcqlResult
  credentialsByQuery: Map<string, DcqlSubmissionCredential[]>
  transactionData: TransactionDataInput[]
}): FormattedSubmissionCredentialSet[] {
  return resolvedDcql.credentialSets.map((credentialSet, credentialSetIndex) => ({
    id: `dcql-set-${credentialSetIndex}`,
    description: credentialSet.description,
    required: credentialSet.required,
    slots: credentialSet.slots.map((slot, slotIndex) => ({
      id: `dcql-set-${credentialSetIndex}-slot-${slotIndex}`,
      optional: slot.optional,
      alternatives: slot.alternatives.map<FormattedSubmissionCredentialAlternative>((alternative) => {
        const queryCredential = dcqlQuery.credentials.find(
          (credential) => credential.id === alternative.credentialQueryId
        )
        const placeholderCredential = queryCredential
          ? extractCredentialPlaceholderFromQueryCredential(queryCredential)
          : undefined
        const credentials = alternative.credentials.flatMap((credential) => {
          const formatted = formatResolvedCredentialForSubmission(
            alternative.credentialQueryId,
            credential,
            credentialsByQuery
          )

          return formatted ? [formatted] : []
        })
        const hasTransactionData = alternative.credentials.some((credential) => credential.transactionData)
        const matchingCredentialNames = getCredentialNamesForQuery(alternative.credentialQueryId, credentialsByQuery)
        const credentialName = alternative.credentials[0]?.display?.name ?? placeholderCredential?.credentialName
        const missingCredentialError = getMissingCredentialError(queryCredential, credentialName)
        const transactionDataError =
          credentials.length === 0
            ? getUnsupportedTransactionDataError(
                alternative.credentialQueryId,
                transactionData,
                queryCredential,
                credentialName,
                matchingCredentialNames
              )
            : !hasTransactionData
              ? getUnsupportedTransactionDataError(
                  alternative.credentialQueryId,
                  transactionData,
                  queryCredential,
                  credentialName,
                  matchingCredentialNames
                )
              : undefined
        const error = credentials.length === 0 && !transactionDataError ? missingCredentialError : undefined

        return {
          inputDescriptorId: alternative.credentialQueryId,
          name: credentialName,
          credentials,
          error,
          transactionDataError,
          transactionDataByCredentialId: Object.fromEntries(
            alternative.credentials.flatMap((credential) =>
              credential.transactionData
                ? [[credential.credentialId, formatResolvedTransactionData(credential.transactionData)] as const]
                : []
            )
          ),
        }
      }),
    })),
  }))
}

export function formatResolvedDcqlCredentialsForRequest({
  dcqlQuery,
  resolvedDcql,
  credentialsByQuery,
  transactionData = [],
}: {
  dcqlQuery: DcqlQuery
  resolvedDcql: ResolvedDcqlResult
  credentialsByQuery: Map<string, DcqlSubmissionCredential[]>
  transactionData?: TransactionDataInput[]
}): FormattedSubmission {
  const credentialSets = formatCredentialSets({ dcqlQuery, resolvedDcql, credentialsByQuery, transactionData })
  const entries = dcqlQuery.credentials.map((credential) => formatSubmissionEntry(credential, credentialSets))

  return {
    areAllSatisfied: areCredentialSetsSatisfied(credentialSets),
    credentialSets,
    entries,
  }
}
