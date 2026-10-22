---
"@paradym/wallet-sdk": minor
---

Update Credo to `0.8.0-alpha` and `@openid4vc/*` to `^0.8.0`. Credo 0.8 removes the deprecated DIDComm Issue Credential v1 and Present Proof v1 protocols, so the wallet only accepts v2 credential offers and proof requests over DIDComm. The Indy and AnonCreds formats still work with the v2 protocols.
