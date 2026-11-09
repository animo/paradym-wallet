---
'@paradym/wallet-sdk': patch
---

OpenID4VCI issuers in the `trustedEntities` of the `none` trust mechanism are now matched on the exact `credential_issuer` instead of a prefix. An issuer whose URL only starts with a trusted `issuer` is no longer trusted.
