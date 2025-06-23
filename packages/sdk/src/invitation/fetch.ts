import type { FullAgent, OpenId4VcAgent } from '../agent'
import { ParadymWalletInvitationNotRecognizedError, ParadymWalletInvitationRetrievalError } from '../error'
import { type InvitationResult, parseOpenIdPresentationRequestInvitation } from './parser'

export type FetchInvitationResult = InvitationResult

export async function fetchInvitationDataUrl(agent: FullAgent, dataUrl: string): Promise<FetchInvitationResult> {
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
    return handleTextResponse(agent, text)
  } catch (error) {
    clearTimeout(timeout)
    throw new ParadymWalletInvitationRetrievalError()
  }
}

// TODO: what is the structure for didcomm?
function handleJsonResponse(json: unknown): FetchInvitationResult {
  // We expect a JSON object
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new ParadymWalletInvitationNotRecognizedError()
  }

  if ('@type' in json) {
    throw new ParadymWalletInvitationNotRecognizedError('not yet supported')
  }

  if ('credential_issuer' in json) {
    throw new ParadymWalletInvitationNotRecognizedError('not yet supported')
  }

  throw new ParadymWalletInvitationNotRecognizedError()
}

async function handleTextResponse(agent: OpenId4VcAgent, text: string): Promise<FetchInvitationResult> {
  // If the text starts with 'ey' we assume it's a JWT and thus an OpenID authorization request
  if (text.startsWith('ey')) {
    const { id, formattedSubmission } = await parseOpenIdPresentationRequestInvitation(agent, text)
    return {
      __internal: {
        id,
      },
      presentationRequest: {
        formattedSubmission,
      },
    }
  }

  const json = JSON.parse(text)
  return handleJsonResponse(json)
}
