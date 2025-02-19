import {
  registerCredentials,
  type DigitalCredentialsRequest,
  sendResponse,
  sendErrorResponse,
} from '@animo-id/expo-digital-credentials-api'
import type { EitherAgent } from '../agent'
import { getCredentialForDisplay } from '../display'
import { type CredentialsForProofRequest, getCredentialsForProofRequest, shareProof } from '../invitation'
import { getHostNameFromUrl } from '@package/utils'
import type { MdocNameSpaces } from '@credo-ts/core'

function mapAttributes(namespaces: MdocNameSpaces) {
  return Object.fromEntries(
    Object.entries(namespaces).map(([namespace, values]) => [
      namespace,
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => {
          if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
            return [key, `${value}`]
          }

          if (value === null || value === undefined) {
            return [key, `${value}`]
          }

          if (value instanceof Uint8Array) {
            return [key, 'buffer']
          }
          if (value instanceof Date) {
            // TODO: handle DateOnly and Date
            return [key, value.toISOString()]
          }
          if (value instanceof Map) {
            return [key, 'map']
          }
          if (Array.isArray(value)) return [key, 'array']

          return [key, 'object']
        })
      ),
    ])
  )
}

export async function registerCredentialsForDcApi(agent: EitherAgent) {
  const mdocRecords = await agent.mdoc.getAll()

  const credentials = mdocRecords.map((record) => {
    const mdoc = record.credential
    const { display } = getCredentialForDisplay(record)

    // TODO: library should support claim display mapping
    // TODO: library should supported nested values
    return {
      id: record.id,
      credential: {
        doctype: mdoc.docType,
        format: 'mso_mdoc',
        namespaces: mapAttributes(mdoc.issuerSignedNamespaces),
      },
      display: {
        title: display.name,
        subtitle: display.description,
      },
    } as const
  })

  agent.config.logger.debug('Registering credentials for Digital Credentials API', {
    credentials,
  })
  await registerCredentials({
    credentials,
  })
}

export async function resolveRequestForDcApi({
  agent,
  request,
}: { agent: EitherAgent; request: DigitalCredentialsRequest }) {
  const provider = request.request.providers[request.selectedEntry.providerIndex]

  // verifiable-credentials.dev contains a client_id
  const { client_id, ...filteredRequest } = JSON.parse(provider.request)

  // TODO: should allow limiting it to a specific credential
  const result = await getCredentialsForProofRequest({
    agent,
    // FIXME: we already have the parsed request, which is supported by Credo, but not the API definition of Credo
    uri: filteredRequest,
    origin: request.origin,
  })

  if (result.formattedSubmission.entries.length !== 1) {
    throw new Error('Only requests for a single credential supported for digital credentials api')
  }

  if (result.formattedSubmission.entries[0].isSatisfied) {
    const credential = result.formattedSubmission.entries[0].credentials.find(
      (c) => c.credential.record.id === request.selectedEntry.credentialId
    )
    if (!credential)
      throw new Error(
        `Could not find selected credential with id '${request.selectedEntry.credentialId}' in formatted submission`
      )

    // Update to only contain the already selected credential
    result.formattedSubmission.entries[0].credentials = [credential]
  }

  return {
    ...result,
    verifier: {
      ...result.verifier,
      hostName: getHostNameFromUrl(request.origin),
    },
  }
}

export async function sendResponseForDcApi({
  agent,
  resolvedRequest,
  dcRequest,
}: { agent: EitherAgent; resolvedRequest: CredentialsForProofRequest; dcRequest: DigitalCredentialsRequest }) {
  const firstEntry = resolvedRequest.formattedSubmission.entries[0]
  if (!firstEntry.isSatisfied) {
    throw new Error('Expected one entry for DC API response')
  }

  // TODO: this should be create response method
  const result = await shareProof({
    agent,
    resolvedRequest,
    selectedCredentials: {
      [firstEntry.inputDescriptorId]: dcRequest.selectedEntry.credentialId,
    },
  })

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const response = (result as any).response

  agent.config.logger.debug('Sending response for Digital Credentials API', {
    result,
  })

  sendResponse({
    response: JSON.stringify(response),
  })
}

export async function sendErrorResponseForDcApi(errorMessage: string) {
  sendErrorResponse({
    errorMessage,
  })
}
