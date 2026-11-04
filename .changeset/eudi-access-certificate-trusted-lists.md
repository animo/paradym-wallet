---
'@paradym/wallet-sdk': patch
---

Trust EUDI access certificates through lists of access certificate providers (ETSI TS 119 602), set as `trustedLists` on the `x509` trust mechanism. A verifier, reader or issuer whose chain leads to a listed provider is trusted by that provider, with its country as `territory` and revocation checked, and its name is taken from its access certificate rather than its own metadata, which also leaves out its logo.

- Remove the `eudi_rp_authentication` trust mechanism, the `TrustList` type and the `allowUntrusted` option of `resolveCredentialRequest`, together with the `@animo-id/eudi-wallet-functionality` dependency.
