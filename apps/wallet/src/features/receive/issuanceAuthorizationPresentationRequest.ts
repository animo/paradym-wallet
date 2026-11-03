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
