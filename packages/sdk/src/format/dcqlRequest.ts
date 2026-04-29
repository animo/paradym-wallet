import {
  type DcqlQuery,
  type MatchedCredential,
  type ResolvedWalletCredential,
  resolveDcql,
  type TransactionDataInput,
} from '@animo-id/eudi-wallet-ts12-dcql'
import { zScaCredentialMetadata } from '@animo-id/eudi-wallet-ts12-validation'
import { ClaimFormat, type DcqlQueryResult, type MdocNameSpaces, type NonEmptyArray } from '@credo-ts/core'
import { getDisclosedAttributePathArrays } from '../display/common'
import { getCredentialForDisplay } from '../display/credential'
import { getAttributesAndMetadataForMdocPayload } from '../display/mdoc'
import { getAttributesAndMetadataForSdJwtPayload } from '../display/sdJwt'
import { getOpenId4VcCredentialMetadata } from '../metadata/credentials'
import type { CredentialRecord } from '../storage/credentials'
import { formatAttributesWithRecordMetadata } from './attributes'
import type {
  FormattedSubmission,
  FormattedSubmissionCredentialAlternative,
  FormattedSubmissionCredentialSet,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfiedCredential,
  FormattedSubmissionTransactionData,
} from './submission'

function extractCredentialPlaceholderFromQueryCredential(credential: DcqlQueryResult['credentials'][number]) {
  if (credential.format === 'mso_mdoc') {
    return {
      claimFormat: ClaimFormat.MsoMdoc,
      credentialName: credential.meta?.doctype_value ?? 'Unknown',
      requestedAttributePaths: credential.claims?.map((c) => ('path' in c ? [c.path[1]] : [c.claim_name])),
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
      requestedAttributePaths: credential.claims?.map((c) => c.path),
    }
  }

  return {
    claimFormat: ClaimFormat.JwtVc,
    requestedAttributePaths: credential.claims?.map((c) => c.path),
  }
}

export type FormatDcqlCredentialsForRequestOptions = {
  dcqlQuery?: Record<string, unknown>
  transactionData?: unknown
}

type DcqlValidCredential = {
  record: CredentialRecord
}

function formatResolvedValue(value: unknown) {
  if (value && typeof value === 'object' && 'value' in value) {
    return formatResolvedValue(value.value)
  }

  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === undefined || value === null) return ''

  return JSON.stringify(value)
}

function formatTransactionData(
  transactionData: NonNullable<ResolvedWalletCredential['transactionData']>
): FormattedSubmissionTransactionData {
  const uiLabels = transactionData.resolved?.ui_labels

  return {
    index: transactionData.index,
    type: transactionData.entry.type,
    title: formatResolvedValue(uiLabels?.transaction_title) || undefined,
    securityHint: formatResolvedValue(uiLabels?.security_hint) || undefined,
    affirmativeActionLabel: formatResolvedValue(uiLabels?.affirmative_action_label) || undefined,
    denialActionLabel: formatResolvedValue(uiLabels?.denial_action_label) || undefined,
    claims:
      transactionData.resolved?.claims.map((claim) => ({
        label: formatResolvedValue(claim.label),
        value: formatResolvedValue(claim.value),
      })) ?? [],
  }
}

function isTransactionDataInput(transactionData: unknown): transactionData is TransactionDataInput {
  return (
    !!transactionData &&
    typeof transactionData === 'object' &&
    typeof (transactionData as TransactionDataInput).type === 'string' &&
    Array.isArray((transactionData as TransactionDataInput).credential_ids) &&
    !!(transactionData as TransactionDataInput).payload &&
    typeof (transactionData as TransactionDataInput).payload === 'object'
  )
}

function getScaMetadata(record: CredentialRecord) {
  if (record.type !== 'SdJwtVcRecord') return undefined

  const parsed = zScaCredentialMetadata.safeParse(record.typeMetadata)
  return parsed.success ? parsed.data : undefined
}

function getMatchedCredentialsForQuery(
  dcqlQueryResult: DcqlQueryResult,
  credentialQueryId: string
): DcqlValidCredential[] {
  const match = dcqlQueryResult.credential_matches[credentialQueryId]
  return match?.success ? (match.valid_credentials as unknown as DcqlValidCredential[]) : []
}

function formatEudiDcqlCredentialSets(
  dcqlQueryResult: DcqlQueryResult,
  entries: FormattedSubmissionEntry[],
  options: FormatDcqlCredentialsForRequestOptions
): FormattedSubmissionCredentialSet[] | undefined {
  if (!options.dcqlQuery) return undefined

  const transactionData = Array.isArray(options.transactionData)
    ? options.transactionData.filter(isTransactionDataInput)
    : []
  const entriesById = new Map(entries.map((entry) => [entry.inputDescriptorId, entry]))
  const validCredentialsByQueryId = new Map<string, DcqlValidCredential[]>()

  const result = resolveDcql(
    options.dcqlQuery as unknown as DcqlQuery,
    transactionData,
    (query): MatchedCredential[] => {
      const validCredentials = getMatchedCredentialsForQuery(dcqlQueryResult, query.id)
      validCredentialsByQueryId.set(query.id, validCredentials)

      return validCredentials.map(({ record }) => ({
        credentialId: record.id,
        scaMetadata: getScaMetadata(record),
        display: getOpenId4VcCredentialMetadata(record)?.credential.display as MatchedCredential['display'],
      }))
    },
    {
      locales: ['en'],
      mode: 'light',
      valueTypeResolvers: {
        iso_currency_amount: (value) => value,
        string: (value) => value,
      },
      checkNonScaTransactionDataSupport: () => true,
    }
  )

  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.value.credentialSets.map((credentialSet, credentialSetIndex) => ({
    id: `dcql-set-${credentialSetIndex}`,
    description: credentialSet.description,
    required: credentialSet.required,
    slots: credentialSet.slots.map((slot, slotIndex) => ({
      id: `dcql-set-${credentialSetIndex}-slot-${slotIndex}`,
      optional: slot.optional,
      alternatives: slot.alternatives.flatMap<FormattedSubmissionCredentialAlternative>((alternative) => {
        const entry = entriesById.get(alternative.credentialQueryId)
        if (!entry?.isSatisfied) return []

        const credentials = alternative.credentials.flatMap((credential) => {
          const validCredential = validCredentialsByQueryId
            .get(alternative.credentialQueryId)
            ?.find(({ record }) => record.id === credential.credentialId)
          const formatted = entry.credentials.find((c) => c.credential.record.id === credential.credentialId)

          return validCredential && formatted ? [formatted] : []
        })

        return [
          {
            inputDescriptorId: alternative.credentialQueryId,
            name: alternative.credentials[0]?.display?.name ?? entry.name,
            credentials,
            transactionDataByCredentialId: Object.fromEntries(
              alternative.credentials.flatMap((credential) =>
                credential.transactionData
                  ? [[credential.credentialId, formatTransactionData(credential.transactionData)] as const]
                  : []
              )
            ),
          },
        ]
      }),
    })),
  }))
}

export function formatDcqlCredentialsForRequest(
  dcqlQueryResult: DcqlQueryResult,
  options: FormatDcqlCredentialsForRequestOptions = {}
): FormattedSubmission {
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
    credentialSets: formatEudiDcqlCredentialSets(dcqlQueryResult, entries, options),
    entries,
  }
}
