---
'@paradym/wallet-sdk': patch
---

OpenID4VP over the Digital Credentials API on iOS 27.3 and later.

- SD-JWT VCs are registered with iOS, by their `vct` and the vcts their type extends. Only the types in the app's `…verifiable-credential-types` entitlement are registered.
- `ParadymDcApiSdk.reviewRequest` reviews and answers an OpenID4VP request from iOS the same way as one from Android. iOS has no credential picker, so the wallet selects the credentials.

Updates `@animo-id/expo-digital-credentials-api` to a version with iOS OpenID4VP support.
