import {
  type ResolvedTs12Metadata,
  resolveTs12TransactionDisplayMetadata,
  ts12BuiltinSchemaValidators,
  type ZScaAttestationExt,
  zFunkeQesTransaction,
} from '@animo-id/eudi-wallet-functionality'
import { SdJwtVcRecord } from '@credo-ts/core'
import type { FormattedSubmissionEntry, FormattedSubmissionEntrySatisfied } from '@package/agent'
import Ajv from 'ajv'
import type { CredentialsForProofRequest } from './handler'

const ajv = new Ajv()

export type QtspInfo = CredentialsForProofRequest['verifier']

export type QesTransactionDataEntry = {
  type: 'qes_authorization'
  documentNames: string[]
  qtsp: QtspInfo
  formattedSubmissions: FormattedSubmissionEntry[]
}

export type Ts12TransactionDataEntry = {
  type: string
  metaForIds: Record<string, ResolvedTs12Metadata>
  payload: unknown
  formattedSubmissions: FormattedSubmissionEntry[]
}

export type FormattedTransactionDataEntry = QesTransactionDataEntry | Ts12TransactionDataEntry
export type FormattedTransactionData = FormattedTransactionDataEntry[]

export async function getTs12TransactionDataTypes(records: Record<string, SdJwtVcRecord>) {
  const metadata = (
    await Promise.all(
      Object.entries(records).map(async ([id, rec]) => {
        const metadata = rec.typeMetadata as ZScaAttestationExt | undefined
        if (metadata) return [id, metadata]
        // FIXME: this is a hack, we should probably have a better way to get the vct
        // const vct = rec.firstCredential.payload.vct as string
        // if (!getHostNameFromUrl(vct)) return undefined
        // try {
        //   const response = await fetch(encodeURI(vct))
        //   const text = await response.text()
        //   return [id, JSON.parse(text) as ZScaAttestationExt]
        // } catch (e) {
        //   console.error(`failed to query vct metadata for ${vct}`, e)
        // }
        return undefined
      })
    )
  ).filter((x): x is [string, ZScaAttestationExt] => !!x)

  const resolved = await Promise.all(
    metadata.flatMap(([recId, metadata]) => {
      if (metadata && 'transaction_data_types' in metadata) {
        return Object.keys(metadata.transaction_data_types).map(
          async (key) =>
            [key, recId, await resolveTs12TransactionDisplayMetadata(metadata, key).catch((_) => undefined)] as const
        )
      }
      return []
    })
  )

  const types = {} as Record<string, Record<string, ResolvedTs12Metadata>>
  for (const [type, id, meta] of resolved) {
    if (!meta) continue
    types[type] ??= {}
    types[type][id] = meta
  }
  return types
}

export const getFormattedTransactionData = async (
  credentialsForRequest?: CredentialsForProofRequest
): Promise<FormattedTransactionData | undefined> => {
  if (!credentialsForRequest) return undefined

  const transactionData = credentialsForRequest.transactionData

  if (!transactionData || transactionData.length === 0) return undefined

  // Collect records for TS12 processing
  const records: Record<string, SdJwtVcRecord> = {}
  for (const entry of credentialsForRequest.formattedSubmission.entries) {
    if (!entry.isSatisfied) continue
    for (const credential of entry.credentials) {
      if (credential.credential.record instanceof SdJwtVcRecord) {
        records[credential.credential.id] = credential.credential.record
      }
    }
  }

  const ts12Data = await getTs12TransactionDataTypes(records)

  return transactionData.map((transactionDataEntry) => {
    const data = transactionDataEntry.entry.transactionData
    const type = data.type

    if (type === 'qes_authorization') {
      const signingData = zFunkeQesTransaction.parse(data)
      const formattedSubmissions = transactionDataEntry.matchedCredentialIds
        .map((id) => credentialsForRequest.formattedSubmission.entries.find((a) => a.inputDescriptorId === id))
        .filter((x): x is FormattedSubmissionEntrySatisfied => x?.isSatisfied === true)

      return {
        type: type,
        documentNames: signingData.documentDigests.map((it) => it.label),
        qtsp: credentialsForRequest.verifier, // Just use RP info for now
        formattedSubmissions,
      } satisfies QesTransactionDataEntry
    }

    const metas = ts12Data[type]
    if (!('payload' in data) || !metas)
      throw new Error(`Transaction Data of type ${type} is not supported: ${JSON.stringify(data)}`)

    const payload = data.payload
    const metaForIds: Record<string, ResolvedTs12Metadata> = {}

    for (const [id, meta] of Object.entries(metas)) {
      if (
        (typeof meta.schema === 'string' &&
          ts12BuiltinSchemaValidators[meta.schema as keyof typeof ts12BuiltinSchemaValidators]?.safeParse(payload)
            ?.success) ||
        (meta.schema && typeof meta.schema === 'object' && ajv.compile(meta.schema)(payload))
      ) {
        metaForIds[id] = meta
      }
    }
    // FIXME: this is certainly buggy, this should be able to apply constraints on the matched credentials for the inputDescriptorId that applied to the transaction data, but it is unclear how it would work with OR relationships, or if the objects are cloned at any point
    const formattedSubmissions = transactionDataEntry.matchedCredentialIds
      .map((id) => credentialsForRequest.formattedSubmission.entries.find((a) => a.inputDescriptorId === id))
      .filter((x): x is FormattedSubmissionEntrySatisfied => x?.isSatisfied === true)
      .filter((it) => {
        const credentials = it.credentials.filter((it) => Object.hasOwn(metaForIds, it.credential.id))
        if (credentials.length > 0) {
          it.credentials = credentials as typeof it.credentials
          return true
        }
        return false
      })

    if (formattedSubmissions.length === 0) {
      throw new Error(`No credentials for Transaction Data ${type} could be found`)
    }

    return {
      type,
      metaForIds,
      payload,
      formattedSubmissions,
    } satisfies Ts12TransactionDataEntry
  })
}
