---
'@paradym/wallet-sdk': patch
---

Resolving a credential offer no longer fails when the issuer metadata is signed with an x509 certificate or DID the wallet doesn't trust. The issuer resolves as untrusted, unless it matches a trusted issuer URL.
