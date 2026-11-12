---
'@paradym/wallet-sdk': patch
---

The `purpose` of a resolved OpenID4VP request is now only the purpose the request states itself when the verifier is trusted, so an untrusted verifier can't make its request look reasonable. A purpose from the verifier's verified registration certificate still comes first.
