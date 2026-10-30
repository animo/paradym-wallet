# @paradym/wallet-sdk

## 0.0.1

### Patch Changes

- 0c1eddb: Update `@credo-ts/*` to 0.8.0-alpha-20261027143516, `@openid4vc/*` to 0.8.2, `@owf/mdoc` to 0.9.1 and `@owf/cose` to 0.6.0.
  
  - DIDComm issue credential v1 and present proof v1, the legacy indy credential formats and legacy connection invitations (`c_i`) are no longer supported, as Credo 0.8 removed them. Pending v1 offers and requests are left out of the inbox.
  - ISO mdoc requests are answered by their use cases (ISO/IEC 18013-5 second edition, ISO/IEC TS 23220-4), over proximity and the digital credentials API on Android and iOS. A use case can be answered with several documents, and a requested element with one of its alternative sets. The review shows the documents and elements that are sent.
- 0c1eddb: A share answered through the DC API request UI is now written to the activity log before the response is sent. Sending the response closes the request UI, and on Android its process ends with it, so an entry written afterwards could be lost.
- 946ccae: Declare `query-string` as a dependency. The invitation parser imported it without listing it, so it only resolved when another package installed it.
- 5042b94: `declineCredentialRequest` now sends an OpenID4VP `access_denied` error response to the verifier with Credo's `declineOpenId4VpAuthorizationRequest`, and opens the `redirect_uri` the verifier returns. It also accepts the `Openid4vpAuthorizationRequestError` that `resolveCredentialRequest` throws for an invalid request, to send that error to the verifier. The `redirect_uri` of a verifier that could not be authenticated is not opened. The result has the `redirectUri` that was opened. Without one, the user has to go back to the app that started the request themselves.
- c61b1d4: Update to Expo SDK 58: `expo-crypto`, `expo-file-system`, `expo-image`, `expo-image-manipulator` and `expo-secure-store` to 58.x and `@shopify/react-native-skia` to 2.14.0. Update `@openwallet-foundation/askar-react-native` to 0.7.0-alpha and `@hyperledger/anoncreds-react-native` to 0.5.0-alpha, which support React Native 0.87 and later.
- 05bda9e: Add the `legacyIds` option, for wallets that change their store id. On unlock, when no store exists under `id` yet, the store under the first legacy id that has one is moved to `id`. A reset removes the stores under the legacy ids as well. `moveLegacyStore` does the same for other stores the wallet keeps.
- 1403da7: Resetting a locked wallet, or one whose wallet key was acquired but not unlocked, now removes the wallet store too. Before, it only removed the salt. A store left behind from an interrupted onboarding then couldn't be opened with the next PIN, so onboarding failed every time. `reset` takes the wallet configuration as a second argument, to find the store without an unlocked `ParadymWalletSdk`.
- 0c1eddb: Update `@animo-id/expo-digital-credentials-api` to 0.6.0, which runs the Android request UI in a process of its own. The shared MMKV store now opens in multi-process mode on Android as well, so the app and the request UI can write the same settings at the same time.
- c61b1d4: `unlock({ enableBiometrics: false })` now turns biometric unlock off. Before, biometrics counted as enabled until something set them, so the next unlock stored the wallet key for biometrics and the unlock after that asked for a biometric.
- 56c0aa0: Resolving a credential offer no longer fails when the issuer metadata is signed with an x509 certificate or DID the wallet doesn't trust. The issuer resolves as untrusted, unless it matches a trusted issuer URL.
- 946ccae: Update `@tanstack/react-query` to 5.105.0, `react-native-fs` (`@dr.pogodin/react-native-fs`) to 2.40.4 and `react-native-quick-crypto` to 1.1.9.
