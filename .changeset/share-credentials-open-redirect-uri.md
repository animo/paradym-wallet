---
"@paradym/wallet-sdk": patch
---

`shareCredentials` accepts `openRedirectUri: false` to not open the `redirect_uri` the verifier returns in the system browser. The result still has the `redirectUri`, so the wallet can open it itself, for example to continue an OpenID4VCI authorization that requested a presentation in the browser session it started from.
