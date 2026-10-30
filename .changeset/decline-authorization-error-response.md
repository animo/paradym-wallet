---
"@paradym/wallet-sdk": patch
---

`declineCredentialRequest` now sends an OpenID4VP `access_denied` error response to the verifier with Credo's `declineOpenId4VpAuthorizationRequest`, and opens the `redirect_uri` the verifier returns. It also accepts the `Openid4vpAuthorizationRequestError` that `resolveCredentialRequest` throws for an invalid request, to send that error to the verifier. The `redirect_uri` of a verifier that could not be authenticated is not opened. The result has the `redirectUri` that was opened. Without one, the user has to go back to the app that started the request themselves.
