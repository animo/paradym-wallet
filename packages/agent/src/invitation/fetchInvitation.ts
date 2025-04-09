import type { ParseInvitationResult, ParseInvitationResultError, ParsedInvitationTypeData } from './parsers'

const errorResponse = (error: ParseInvitationResultError, message: string) => {
  return {
    success: false,
    error,
    message,
  } as const
}

export type FetchInvitationResult = ParseInvitationResult | { success: true; result: ParsedInvitationTypeData }

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
      return errorResponse('retrieve_invitation_error', 'Unable to retrieve invitation.')
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const json: unknown = await response.json()
      return handleJsonResponse(json)
    }
    const text = await response.text()
    return handleTextResponse(text)
  } catch (error) {
    clearTimeout(timeout)
    return errorResponse('retrieve_invitation_error', 'Unable to retrieve invitation.')
  }
}

function handleJsonResponse(json: unknown): FetchInvitationResult {
  // We expect a JSON object
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return errorResponse('invitation_not_recognized', 'Invitation not recognized.')
  }

  if ('@type' in json) {
    return {
      success: true,
      result: {
        format: 'parsed',
        type: 'didcomm',
        data: json,
      },
    }
  }

  if ('credential_issuer' in json) {
    return {
      success: true,
      result: {
        format: 'parsed',
        type: 'openid-credential-offer',
        data: json,
      },
    }
  }

  return errorResponse('invitation_not_recognized', 'Invitation not recognized.')
}

function handleTextResponse(text: string): FetchInvitationResult {
  // If the text starts with 'ey' we assume it's a JWT and thus an OpenID authorization request
  if (text.startsWith('ey')) {
    return {
      success: true,
      result: {
        format: 'parsed',
        type: 'openid-authorization-request',
        data: text,
      },
    }
  }

  // Otherwise we still try to parse it as JSON
  try {
    const json: unknown = JSON.parse(text)
    return handleJsonResponse(json)

    // handel like above
  } catch (error) {
    return errorResponse('invitation_not_recognized', 'Invitation not recognized.')
  }
}
