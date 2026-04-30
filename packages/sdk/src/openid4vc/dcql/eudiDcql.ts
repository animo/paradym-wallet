import {
  type DcqlCredentialQuery,
  type DcqlQuery,
  type MatchedCredential,
  type ResolvedDcqlResult,
  resolveDcql,
  type TransactionDataInput,
} from '@animo-id/eudi-wallet-ts12-dcql'
import { zScaCredentialMetadata } from '@animo-id/eudi-wallet-ts12-validation'
import {
  ClaimFormat,
  CredentialMultiInstanceUseMode,
  type DcqlCredentialsForRequest,
  type DcqlQueryResult,
  type JsonObject,
  type MdocNameSpaces,
  type NonEmptyArray,
  type SdJwtVcRecord,
} from '@credo-ts/core'
import { getOid4vcCallbacks, type OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import { Openid4vpClient, type parseTransactionData } from '@openid4vc/openid4vp'
import { isRecord } from '../../dcApi/utils'
import { type DcqlSubmissionCredential, formatResolvedDcqlCredentialsForRequest } from '../../format/dcqlRequest'
import { getOpenId4VcCredentialMetadata } from '../../metadata/credentials'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import type { CredentialRecord, W3cCredentialRecord, W3cV2CredentialRecord } from '../../storage/credentials'
import {
  computeEudiPaymentIntegrity,
  eudiPaymentScaMetadata,
  isEudiPaymentCredentialVct,
} from '../eudiPaymentTransactionData'
import {
  credentialSupportsTransactionData,
  isCredentialQueryTargetedByTransactionData,
} from '../transactionDataRegistry'

const supportedDcqlFormats = new Set(['mso_mdoc', 'vc+sd-jwt', 'dc+sd-jwt', 'jwt_vc_json', 'ldp_vc'])

export type EudiDcqlResolution = OpenId4VpResolvedAuthorizationRequest & {
  authorizationRequestIntegrity?: string
  eudiDcql: EudiDcqlRequest
  formattedSubmission: ReturnType<typeof formatResolvedDcqlCredentialsForRequest>
}

type ClaimSetOutput = {
  output: Record<string, unknown>
}

type ParsedTransactionDataEntry = ReturnType<typeof parseTransactionData>[number]

export type EudiDcqlRequest = {
  query: DcqlQuery
  resolved: ResolvedDcqlResult
  credentialsByQuery: Map<string, EudiDcqlValidCredential[]>
}

type EudiDcqlValidCredential = DcqlSubmissionCredential

function getDcqlQuery(input: unknown): DcqlQuery | undefined {
  if (!isRecord(input) || !Array.isArray(input.credentials)) return undefined

  const credentials = input.credentials.filter(
    (credential): credential is DcqlCredentialQuery =>
      isRecord(credential) && typeof credential.id === 'string' && typeof credential.format === 'string'
  )

  if (credentials.length !== input.credentials.length) {
    throw new Error('Invalid DCQL query credentials')
  }

  return input as unknown as DcqlQuery
}

function getPathValue(source: unknown, path: Array<string | number | null>) {
  let value = source

  for (const segment of path) {
    if (segment === null) return undefined
    if (Array.isArray(value) && typeof segment === 'number') {
      value = value[segment]
    } else if (isRecord(value) && typeof segment === 'string') {
      value = value[segment]
    } else {
      return undefined
    }
  }

  return value
}

function setPathValue(target: Record<string, unknown>, path: Array<string | number | null>, value: unknown) {
  let current = target

  for (const [index, segment] of path.entries()) {
    if (segment === null) return false
    if (index === path.length - 1) {
      current[String(segment)] = value
      return true
    }

    const key = String(segment)
    if (!isRecord(current[key])) current[key] = {}
    current = current[key] as Record<string, unknown>
  }

  return false
}

function isValueAllowed(value: unknown, allowedValues?: Array<string | number | boolean>) {
  if (!allowedValues) return true
  return allowedValues.some((allowedValue) => allowedValue === value)
}

function getClaimSetCandidates(query: DcqlCredentialQuery) {
  if (!query.claims || query.claims.length === 0) return undefined
  if (!query.claim_sets || query.claim_sets.length === 0) return [query.claims]

  return query.claim_sets.map((claimSet) => {
    const claims = claimSet.map((claimId) => query.claims?.find((claim) => claim.id === claimId))
    return claims.every((claim) => claim !== undefined) ? claims : []
  })
}

function getValidClaimSetOutputs(query: DcqlCredentialQuery, source: Record<string, unknown>): ClaimSetOutput[] {
  const candidates = getClaimSetCandidates(query)
  if (!candidates) return [{ output: source }]

  return candidates.flatMap((claims) => {
    if (claims.length === 0) return []

    const output: Record<string, unknown> = {}
    for (const claim of claims) {
      const value = getPathValue(source, claim.path)
      if (value === undefined || !isValueAllowed(value, claim.values)) return []
      if (!setPathValue(output, claim.path, value)) return []
    }

    return [{ output }]
  })
}

function getSdJwtVcts(record: SdJwtVcRecord) {
  const payloadVct = record.firstCredential.payload.vct
  const vcts = [
    typeof payloadVct === 'string' ? payloadVct : undefined,
    record.getTags().vct,
    ...(record.typeMetadataChain?.map((entry) => entry.vct) ?? []),
  ].filter((vct): vct is string => typeof vct === 'string' && vct.length > 0)

  return new Set(vcts)
}

function asArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value]
}

function getScaMetadata(record: EudiDcqlValidCredential['record']) {
  if (record.type !== 'SdJwtVcRecord') return undefined

  const vcts = getSdJwtVcts(record)
  const parsed = zScaCredentialMetadata.safeParse(record.typeMetadata)
  if (parsed.success) {
    return isEudiPaymentCredentialVct(vcts)
      ? {
          ...parsed.data,
          transaction_data_types: {
            ...eudiPaymentScaMetadata.transaction_data_types,
            ...parsed.data.transaction_data_types,
          },
        }
      : parsed.data
  }

  return isEudiPaymentCredentialVct(vcts) ? eudiPaymentScaMetadata : undefined
}

function isSupportedDcqlQuery(query: DcqlCredentialQuery) {
  return supportedDcqlFormats.has(query.format)
}

function getTypeValues(query: DcqlCredentialQuery) {
  if (!isRecord(query.meta) || !Array.isArray(query.meta.type_values)) return undefined

  const typeValues = query.meta.type_values.filter(
    (value): value is string[] => Array.isArray(value) && value.every((type) => typeof type === 'string')
  )

  return typeValues.length > 0 ? typeValues : undefined
}

function hasMatchingTypeValues(query: DcqlCredentialQuery, credentialTypes: string[]) {
  return getTypeValues(query)?.some((typeValues) => typeValues.every((type) => credentialTypes.includes(type))) ?? false
}

function getW3cCredentialPayload(record: W3cCredentialRecord | W3cV2CredentialRecord): Record<string, unknown> {
  return record.type === 'W3cCredentialRecord'
    ? record.firstCredential.jsonCredential
    : record.firstCredential.resolvedCredential.toJSON()
}

function toValidCredential(query: DcqlCredentialQuery, record: CredentialRecord, source: Record<string, unknown>) {
  const validClaimSets = getValidClaimSetOutputs(query, source)
  if (validClaimSets.length === 0) return undefined

  return {
    record,
    claims: { valid_claim_sets: validClaimSets as NonEmptyArray<ClaimSetOutput> },
  }
}

async function getValidCredentials(
  paradym: ParadymWalletSdk,
  query: DcqlCredentialQuery,
  transactionData: TransactionDataInput[]
): Promise<EudiDcqlValidCredential[]> {
  if (!isSupportedDcqlQuery(query)) return []

  if (query.format === 'mso_mdoc') {
    const doctype = isRecord(query.meta) ? query.meta.doctype_value : undefined
    if (typeof doctype !== 'string') return []

    const records = await paradym.agent.mdoc.getAll()
    return records.flatMap((record) => {
      if (record.firstCredential.docType !== doctype) return []

      const validCredential = toValidCredential(
        query,
        record,
        record.firstCredential.issuerSignedNamespaces as Record<string, unknown>
      )

      return validCredential ? [validCredential] : []
    })
  }

  if (
    query.format === 'dc+sd-jwt' ||
    (query.format === 'vc+sd-jwt' && isRecord(query.meta) && 'vct_values' in query.meta)
  ) {
    const vctValues = isRecord(query.meta) && Array.isArray(query.meta.vct_values) ? query.meta.vct_values : undefined
    const shouldMatchByTransactionData =
      !vctValues && isCredentialQueryTargetedByTransactionData(query.id, transactionData)
    if (!vctValues && !shouldMatchByTransactionData) return []

    const records = await paradym.agent.sdJwtVc.getAll()
    return records.flatMap((record) => {
      const vcts = getSdJwtVcts(record)
      if (vctValues) {
        if (!vctValues.some((vct) => typeof vct === 'string' && vcts.has(vct))) return []
      } else if (
        !credentialSupportsTransactionData({ credentialQueryId: query.id, transactionData, credential: { vcts } })
      ) {
        return []
      }

      const validCredential = toValidCredential(query, record, record.firstCredential.prettyClaims)
      return validCredential ? [validCredential] : []
    })
  }

  if (query.format === 'jwt_vc_json' || query.format === 'ldp_vc') {
    const records = await paradym.agent.w3cCredentials.getAll()
    return records.flatMap((record) => {
      if (query.format === 'jwt_vc_json' && record.firstCredential.claimFormat !== ClaimFormat.JwtVc) return []
      if (query.format === 'ldp_vc' && record.firstCredential.claimFormat !== ClaimFormat.LdpVc) return []

      const credentialTypes = query.format === 'ldp_vc' ? record.getTags().expandedTypes : record.firstCredential.type
      if (!credentialTypes || !hasMatchingTypeValues(query, credentialTypes)) return []

      const validCredential = toValidCredential(query, record, getW3cCredentialPayload(record))
      return validCredential ? [validCredential] : []
    })
  }

  if (query.format === 'vc+sd-jwt' && isRecord(query.meta) && 'type_values' in query.meta) {
    const records = await paradym.agent.w3cV2Credentials.getAll()
    return records.flatMap((record) => {
      if (record.firstCredential.claimFormat !== ClaimFormat.SdJwtW3cVc) return []
      if (!hasMatchingTypeValues(query, asArray(record.firstCredential.resolvedCredential.type))) return []

      const validCredential = toValidCredential(query, record, getW3cCredentialPayload(record))
      return validCredential ? [validCredential] : []
    })
  }

  return []
}

async function resolveEudiDcql(
  paradym: ParadymWalletSdk,
  dcqlQuery: DcqlQuery,
  transactionData: TransactionDataInput[]
): Promise<EudiDcqlRequest> {
  const validCredentialsByQuery = new Map(
    await Promise.all(
      dcqlQuery.credentials.map(
        async (credentialQuery) =>
          [credentialQuery.id, await getValidCredentials(paradym, credentialQuery, transactionData)] as const
      )
    )
  )
  const resolvedDcql = resolveDcql(
    dcqlQuery,
    transactionData,
    (query): MatchedCredential[] =>
      (validCredentialsByQuery.get(query.id) ?? []).map(({ record }) => ({
        credentialId: record.id,
        scaMetadata: getScaMetadata(record),
        display: getOpenId4VcCredentialMetadata(record)?.credential.display as MatchedCredential['display'],
      })),
    {
      locales: ['en'],
      mode: 'light',
      valueTypeResolvers: {
        image: (value) => value,
        iso_currency_amount: (value) => value,
        iso_date: (value) => value,
        iso_date_time: (value) => value,
        label_only: (value) => value,
        string: (value) => value,
        url: (value) => value,
      },
      checkNonScaTransactionDataSupport: () => false,
    }
  )
  if (!resolvedDcql.ok) throw new Error(resolvedDcql.error)

  return {
    query: dcqlQuery,
    resolved: resolvedDcql.value,
    credentialsByQuery: validCredentialsByQuery,
  }
}

function getVerifierAttestationQueryResult(dcqlRequest: EudiDcqlRequest): DcqlQueryResult {
  const { query } = dcqlRequest
  const credentials = query.credentials.filter(isSupportedDcqlQuery)
  const supportedCredentialIds = new Set(credentials.map((credential) => credential.id))

  const credentialSets = query.credential_sets?.flatMap((credentialSet) => {
    const options = credentialSet.options
      .map((option) => option.filter((credentialId) => supportedCredentialIds.has(credentialId)))
      .filter((option) => option.length > 0)

    return options.length > 0
      ? [
          {
            ...credentialSet,
            options,
          },
        ]
      : []
  })

  return {
    ...query,
    credentials,
    credential_sets: credentialSets,
    credential_matches: {},
    can_be_satisfied: true,
  } as DcqlQueryResult
}

function hasResolvedCredential(dcqlRequest: EudiDcqlRequest, credentialQueryId: string, credentialRecordId?: string) {
  return dcqlRequest.resolved.credentialSets.some((credentialSet) =>
    credentialSet.slots.some((slot) =>
      slot.alternatives.some(
        (alternative) =>
          alternative.credentialQueryId === credentialQueryId &&
          alternative.credentials.some(
            (credential) => !credentialRecordId || credential.credentialId === credentialRecordId
          )
      )
    )
  )
}

function getMatchedTransactionData(dcqlRequest: EudiDcqlRequest, transactionData?: ParsedTransactionDataEntry[]) {
  return transactionData?.map((entry) => ({
    entry,
    matchedCredentialIds: entry.transactionData.credential_ids.filter((credentialId) =>
      hasResolvedCredential(dcqlRequest, credentialId)
    ),
  }))
}

function getTransactionDataInput(transactionData?: ParsedTransactionDataEntry[]) {
  return transactionData?.map((entry) => entry.transactionData).filter((entry) => isRecord(entry.payload)) as
    | TransactionDataInput[]
    | undefined
}

export async function resolveEudiDcqlCredentialRequest({
  paradym,
  requestToResolve,
  origin,
}: {
  paradym: ParadymWalletSdk
  requestToResolve: string | Record<string, unknown>
  origin?: string
}): Promise<EudiDcqlResolution | undefined> {
  const openid4vpClient = new Openid4vpClient({
    callbacks: getOid4vcCallbacks(paradym.agent.context, {
      isVerifyOpenId4VpAuthorizationRequest: true,
    }),
  })
  const { params } = openid4vpClient.parseOpenid4vpAuthorizationRequest({ authorizationRequest: requestToResolve })
  const verifiedAuthorizationRequest = await openid4vpClient.resolveOpenId4vpAuthorizationRequest({
    authorizationRequestPayload: params,
    origin,
  })

  const dcqlQuery = getDcqlQuery(verifiedAuthorizationRequest.dcql?.query)
  if (!dcqlQuery) return undefined

  const { client, transactionData } = verifiedAuthorizationRequest
  if (
    client.prefix !== 'x509_san_dns' &&
    client.prefix !== 'x509_hash' &&
    client.prefix !== 'decentralized_identifier' &&
    client.prefix !== 'origin' &&
    client.prefix !== 'redirect_uri'
  ) {
    throw new Error(`Client id prefix '${client.prefix}' is not supported`)
  }

  const transactionDataInput = getTransactionDataInput(transactionData) ?? []
  const eudiDcql = await resolveEudiDcql(paradym, dcqlQuery, transactionDataInput)
  const formattedSubmission = formatResolvedDcqlCredentialsForRequest({
    dcqlQuery,
    resolvedDcql: eudiDcql.resolved,
    credentialsByQuery: eudiDcql.credentialsByQuery,
    transactionData: transactionDataInput,
  })

  const resolution: EudiDcqlResolution = {
    authorizationRequestPayload: verifiedAuthorizationRequest.authorizationRequestPayload,
    authorizationRequestIntegrity: verifiedAuthorizationRequest.jar
      ? computeEudiPaymentIntegrity(verifiedAuthorizationRequest.jar.jwt.compact)
      : undefined,
    origin,
    signedAuthorizationRequest: verifiedAuthorizationRequest.jar
      ? {
          signer: verifiedAuthorizationRequest.jar.signer,
          payload: verifiedAuthorizationRequest.jar.jwt.payload,
          header: verifiedAuthorizationRequest.jar.jwt.header,
        }
      : undefined,
    verifier: {
      clientIdPrefix: client.prefix,
      effectiveClientId: client.effective,
    },
    transactionData: getMatchedTransactionData(eudiDcql, transactionData),
    eudiDcql,
    formattedSubmission,
  }

  return resolution
}

export function getEudiDcqlVerifierAttestationRequest(
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest | EudiDcqlResolution
): OpenId4VpResolvedAuthorizationRequest {
  if (!('eudiDcql' in resolvedAuthorizationRequest)) return resolvedAuthorizationRequest

  return {
    ...resolvedAuthorizationRequest,
    dcql: {
      queryResult: getVerifierAttestationQueryResult(resolvedAuthorizationRequest.eudiDcql),
    },
  }
}

function getCredentialForRequest(
  credentialQueryId: string,
  credentialRecordId: string,
  dcqlRequest: EudiDcqlRequest,
  additionalPayload?: JsonObject
): DcqlCredentialsForRequest[string] | undefined {
  if (!hasResolvedCredential(dcqlRequest, credentialQueryId, credentialRecordId)) return undefined

  const validCredentialMatch = dcqlRequest.credentialsByQuery
    .get(credentialQueryId)
    ?.find(({ record }) => record.id === credentialRecordId)
  if (!validCredentialMatch) return undefined

  if (validCredentialMatch.record.type === 'MdocRecord') {
    return [
      {
        claimFormat: ClaimFormat.MsoMdoc,
        credentialRecord: validCredentialMatch.record,
        disclosedPayload: validCredentialMatch.claims.valid_claim_sets[0].output as MdocNameSpaces,
        useMode: CredentialMultiInstanceUseMode.NewOrFirst,
      },
    ]
  }

  if (validCredentialMatch.record.type === 'SdJwtVcRecord') {
    return [
      {
        claimFormat: ClaimFormat.SdJwtDc,
        credentialRecord: validCredentialMatch.record,
        disclosedPayload: validCredentialMatch.claims.valid_claim_sets[0].output as JsonObject,
        additionalPayload,
        useMode: CredentialMultiInstanceUseMode.NewOrFirst,
      },
    ]
  }

  if (validCredentialMatch.record.type === 'W3cCredentialRecord') {
    return [
      {
        claimFormat: validCredentialMatch.record.firstCredential.claimFormat,
        credentialRecord: validCredentialMatch.record,
        disclosedPayload: validCredentialMatch.claims.valid_claim_sets[0].output as JsonObject,
        useMode: CredentialMultiInstanceUseMode.NewOrFirst,
      },
    ]
  }

  if (validCredentialMatch.record.type === 'W3cV2CredentialRecord') {
    return [
      {
        claimFormat: validCredentialMatch.record.firstCredential.claimFormat,
        credentialRecord: validCredentialMatch.record,
        disclosedPayload: validCredentialMatch.claims.valid_claim_sets[0].output as JsonObject,
        useMode: CredentialMultiInstanceUseMode.NewOrFirst,
      },
    ]
  }
}

export function selectEudiDcqlCredentialsForRequest(
  dcqlRequest: EudiDcqlRequest,
  selectedCredentials: { [credentialQueryId: string]: string },
  additionalPayloadByCredentialQueryId?: Record<string, JsonObject>
): DcqlCredentialsForRequest {
  const credentials: DcqlCredentialsForRequest = {}
  const selectedEntries =
    Object.keys(selectedCredentials).length > 0
      ? Object.entries(selectedCredentials)
      : dcqlRequest.resolved.credentialSets.flatMap((credentialSet) => {
          if (!credentialSet.required) return []

          return credentialSet.slots.flatMap((slot) => {
            if (slot.optional) return []

            const alternative = slot.alternatives.find((alternative) => alternative.credentials.length > 0)
            const credential = alternative?.credentials[0]
            return alternative && credential ? [[alternative.credentialQueryId, credential.credentialId] as const] : []
          })
        })

  for (const selection of selectedEntries) {
    const [credentialQueryId, credentialRecordId] = selection
    const credential = getCredentialForRequest(
      credentialQueryId,
      credentialRecordId,
      dcqlRequest,
      additionalPayloadByCredentialQueryId?.[credentialQueryId]
    )
    if (credential) credentials[credentialQueryId] = credential
  }

  return credentials
}
