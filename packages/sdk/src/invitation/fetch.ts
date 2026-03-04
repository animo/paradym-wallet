import { ParadymWalletInvitationNotRecognizedError, ParadymWalletInvitationRetrievalError } from '../error'
import type { InvitationParsedResult } from './parser'

export type FetchInvitationResult = InvitationParsedResult

export async function fetchInvitationDataUrl(dataUrl: string): Promise<FetchInvitationResult> {
  // If we haven't had a response after 10 seconds, we will handle as if the invitation is not valid.
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 10000)

  try {
    // If we still don't know what type of invitation it is, we assume it is a URL that we need to fetch to retrieve the invitation.
    const response = await fetch(dataUrl, {
      headers: {
        // for DIDComm out of band invitations we should include application/json
        // but we are flexible and also want to support other types of invitations
        // as e.g. the OpenID4VP request is a signed encoded JWT string
        Accept: 'application/json, text/plain, */*',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new ParadymWalletInvitationRetrievalError()
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const json: unknown = await response.json()
      return handleJsonResponse(json)
    }

    const text = await response.text()
    return handleTextResponse(text)
  } catch (_error) {
    clearTimeout(timeout)
    throw new ParadymWalletInvitationRetrievalError()
  }
}

function handleJsonResponse(json: unknown): FetchInvitationResult {
  // We expect a JSON object
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new ParadymWalletInvitationNotRecognizedError()
  }

  if ('@type' in json) {
    return {
      format: 'parsed',
      type: 'didcomm',
      data: json,
    }
  }

  if ('credential_issuer' in json) {
    return {
      format: 'parsed',
      type: 'openid-credential-offer',
      data: json,
    }
  }

  throw new ParadymWalletInvitationNotRecognizedError()
}

async function handleTextResponse(text: string): Promise<FetchInvitationResult> {
  // If the text starts with 'ey' we assume it's a JWT and thus an OpenID authorization request
  if (text.startsWith('ey')) {
    return {
      format: 'parsed',
      type: 'openid-authorization-request',
      data: text,
    }
  }

  // Otherwise we still try to parse it as JSON
  try {
    const json: unknown = JSON.parse(text)
    return handleJsonResponse(json)

    // handel like above
  } catch (_error) {
    throw new ParadymWalletInvitationNotRecognizedError()
  }
}
