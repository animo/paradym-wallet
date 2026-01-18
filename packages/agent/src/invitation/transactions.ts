import {
  type ResolvedTs12Metadata,
  resolveTs12TransactionDisplayMetadata,
  ts12BuiltinSchemaValidators,
  zFunkeQesTransaction,
  zScaAttestationExt,
} from '@animo-id/eudi-wallet-functionality'
import { ConsoleLogger, LogLevel, SdJwtVcRecord } from '@credo-ts/core'
import type {
  CredentialForDisplayId,
  FormattedSubmissionEntry,
  FormattedSubmissionEntrySatisfied,
} from '@package/agent'
import Ajv from 'ajv'
import type { CredentialsForProofRequest } from './handler'

const ajv = new Ajv()
const logger = new ConsoleLogger(LogLevel.warn)

export type QtspInfo = CredentialsForProofRequest['verifier']

export type QesTransactionDataEntry = {
  type: 'qes_authorization'
  documentNames: string[]
  qtsp: QtspInfo
  formattedSubmissions: FormattedSubmissionEntry[]
}

export type Ts12TransactionDataEntry = {
  type: string
  subtype?: string
  metaForIds: Record<string, ResolvedTs12Metadata>
  payload: unknown
  formattedSubmissions: FormattedSubmissionEntry[]
}

export type FormattedTransactionDataEntry = QesTransactionDataEntry | Ts12TransactionDataEntry
export type FormattedTransactionData = FormattedTransactionDataEntry[]

export async function getTs12TransactionDataTypes(records: Record<CredentialForDisplayId, SdJwtVcRecord>) {
  const resolved = (
    await Promise.all(
      Object.entries(records).map(async ([id, record]) => {
        if (!record.typeMetadata) return undefined

        // Check if payment metadata included
        const parsedTypeMetadata = zScaAttestationExt.safeParse(record.typeMetadata)
        if (!parsedTypeMetadata.success) return undefined

        return await Promise.all(
          parsedTypeMetadata.data.transaction_data_types.map(
            async ({ type, subtype }) =>
              [
                type,
                subtype,
                id,
                await resolveTs12TransactionDisplayMetadata(
                  parsedTypeMetadata.data,
                  type,
                  subtype /* todo: integrity verifier */
                ).catch((_) => undefined),
              ] as const
          )
        )
      })
    )
  )
    .filter((x): x is Exclude<typeof x, undefined> => x !== undefined)
    .flat()

  const types = {} as Record<string, Record<string, Record<string, ResolvedTs12Metadata>>>
  for (const [type, subtype, id, meta] of resolved) {
    if (!meta) continue
    types[type] ??= {}
    types[type][subtype ?? ''] ??= {}
    types[type][subtype ?? ''][id] = meta
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

    const subtype = 'subtype' in data && typeof data.subtype === 'string' ? data.subtype : ''
    const metas = ts12Data[type]?.[subtype]
    if (!('payload' in data) || !metas)
      throw new Error(
        `Transaction Data of type ${type}${subtype ? ` and subtype ${subtype}` : ''} is not supported: ${JSON.stringify(data)}`
      )

    const payload = data.payload
    const metaForIds: Record<string, ResolvedTs12Metadata> = {}
    const validationErrors: string[] = []

    for (const [id, meta] of Object.entries(metas)) {
      let success = false
      if (typeof meta.schema === 'string') {
        const validator = ts12BuiltinSchemaValidators[meta.schema as keyof typeof ts12BuiltinSchemaValidators]
        if (validator) {
          const result = validator.safeParse(payload)
          if (result.success) {
            success = true
          } else {
            validationErrors.push(`Validation for ${id} failed: ${result.error.message}`)
          }
        } else {
          validationErrors.push(`Validation for ${id} failed: Schema ${meta.schema} not found`)
        }
      } else if (meta.schema && typeof meta.schema === 'object') {
        try {
          const validate = ajv.compile(meta.schema)
          if (validate(payload)) {
            success = true
          } else {
            validationErrors.push(`Validation for ${id} failed: ${ajv.errorsText(validate.errors)}`)
          }
        } catch (e) {
          validationErrors.push(`Validation for ${id} failed: Error compiling schema: ${e}`)
        }
      } else {
        validationErrors.push(`Validation for ${id} failed: Invalid or missing schema`)
      }

      if (success) {
        metaForIds[id] = meta
      }
    }

    if (validationErrors.length > 0) {
      logger.warn(
        `Transaction Data validation errors for type ${type}${subtype ? ` and subtype ${subtype}` : ''}: ${validationErrors.join('\n')}`
      )
    }

    if (Object.keys(metaForIds).length === 0) {
      throw new Error(
        `Transaction Data validation failed for type ${type}${subtype ? ` and subtype ${subtype}` : ''}. Errors: ${validationErrors.join('\n')}`
      )
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
      throw new Error(`No credentials for Transaction Data ${type} could be found.`)
    }

    return {
      type,
      subtype: subtype || undefined,
      metaForIds,
      payload,
      formattedSubmissions,
    } satisfies Ts12TransactionDataEntry
  })
}
