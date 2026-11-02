---
'@paradym/wallet-sdk': patch
---

Add the `sdJwtVcTypeMetadataLocations` option, which maps a `vct` to the URL its type metadata is fetched from instead. Use it for a type whose publisher doesn't serve its type metadata yet: a type that extends it can't be resolved without it, and issuance of such a credential fails.

`resolveSdJwtVcTypes` returns a `vct` and every type it extends, for deciding on a credential by its type before it is issued. `CredentialMetadata.additionalTypes` now holds the types a received SD-JWT VC extends. Before, it was always empty.

An SD-JWT VC whose type metadata has no `display` now uses the OID4VCI display. Before, it showed a name derived from the `vct`.
