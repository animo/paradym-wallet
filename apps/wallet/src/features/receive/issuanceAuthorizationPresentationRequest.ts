import { parseInvitationUrlSync } from '@paradym/wallet-sdk'

/**
 * The authorization server of an OpenID4VCI authorization code flow can request a presentation
 * (OpenID4VP) as part of the authorization: the page in the browser redirects to an OpenID4VP
 * request for the wallet, and after sharing, the browser continues the authorization at the
 * `redirect_uri` the verifier returns.
 *
 * That OpenID4VP request opens the app as a deeplink. While the browser of an authorization code
 * flow is open, the issuance screen registers a handler here, and `+native-intent` hands the request
 * to it instead of opening the presentation screen.
 */
let handler: ((requestUri: string) => void) | undefined

export function setIssuanceAuthorizationPresentationRequestHandler(newHandler?: (requestUri: string) => void) {
  handler = newHandler
}

/**
 * Hands the OpenID4VP request to the open authorization code flow, if any. A handler takes one request.
 *
 * @returns whether the request was handled
 */
export function handleIssuanceAuthorizationPresentationRequest(requestUri: string) {
  const currentHandler = handler
  if (!currentHandler) return false

  handler = undefined
  currentHandler(requestUri)
  return true
}

/**
 * The authorization server can also return the OpenID4VP request as the `request_uri` from the pushed
 * authorization request, so the wallet can share without opening the browser at all. A wallet that doesn't
 * recognize it opens the authorization endpoint with that `request_uri` as usual, where the authorization
 * server that issued it serves the redirect to the OpenID4VP request.
 *
 * @returns the OpenID4VP request, if the `request_uri` of the authorization request url is one
 */
export function getPushedAuthorizationPresentationRequestUri(authorizationRequestUrl: string) {
  const requestUri = new URL(authorizationRequestUrl).searchParams.get('request_uri')
  // The request uri the authorization endpoint resolves itself, e.g. `urn:ietf:params:oauth:request_uri:<id>`
  if (!requestUri || requestUri.startsWith('https://') || requestUri.startsWith('http://')) return undefined

  try {
    return parseInvitationUrlSync(requestUri).type === 'openid-authorization-request' ? requestUri : undefined
  } catch {
    return undefined
  }
}
