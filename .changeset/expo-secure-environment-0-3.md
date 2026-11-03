---
'@paradym/wallet-sdk': patch
---

Update `@animo-id/expo-secure-environment` to 0.3.0, which Credo 0.8 requires.

- `CredentialKeyOptions.backendOptions` is passed to the backend's `createKey`. For `'secureEnvironment'` these are the `generateKeypair` options, such as `minimumKeyStorage`. The library defaults to StrongBox on Android, which most phones don't have.
- A canceled or unavailable user authentication from the new library is reported as `ParadymWalletBiometricAuthenticationCancelledError` or `ParadymWalletBiometricAuthenticationNotEnabledError`, as before.
- The `shouldUseCloudHsm` setting is no longer shared with the credential request UI.
