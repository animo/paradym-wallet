<p align="center">
  <picture>
   <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-light-no-text_ok9auy.svg">
   <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-dark-no-text_fqqdq9.svg">
   <img alt="Animo Logo" height="250px" />
  </picture>
</p>

<h1 align="center"><b>Paradym Wallet SDK — TypeScript</b></h1>

A React Native library for building wallets that receive, store and present digital credentials over OpenID4VC, DIDComm, the Digital Credentials API and ISO 18013-5 proximity. It supports SD-JWT VC, mdoc, W3C and AnonCreds.

<h4 align="center">Powered by &nbsp;
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656579715/animo-logo-light-text_cma2yo.svg">
    <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656579715/animo-logo-dark-text_uccvqa.svg">
    <img alt="Animo Logo" height="12px" />
  </picture>
</h4><br>

<p align="center">
  <a href="https://typescriptlang.org">
    <img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" />
  </a>
  <a href="https://www.npmjs.com/package/@paradym/wallet-sdk">
    <img src="https://img.shields.io/npm/v/@paradym/wallet-sdk" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a>
  &nbsp;|&nbsp;
  <a href="#quick-start">Quick start</a>
  &nbsp;|&nbsp;
  <a href="#configuration">Configuration</a>
  &nbsp;|&nbsp;
  <a href="#key-security">Key security</a>
  &nbsp;|&nbsp;
  <a href="#internationalization">Internationalization</a>
  &nbsp;|&nbsp;
  <a href="#receiving-credentials">Receiving</a>
  &nbsp;|&nbsp;
  <a href="#presenting-credentials">Presenting</a>
</p>

> [!WARNING]
> The SDK is in alpha. Expect breaking changes between releases.

---

## Installation

```bash
pnpm add @paradym/wallet-sdk @tanstack/react-query
```

The SDK ships native modules (Askar, AnonCreds, keychain, secure environment, MMKV), so it needs a [development build](https://docs.expo.dev/develop/development-builds/introduction/). Expo Go won't work. Rebuild the app after installing:

```bash
npx expo prebuild && npx expo run:ios   # or run:android
```

With pnpm, approve the native builds:

```bash
pnpm approve-builds @paradym/wallet-sdk
```

Peer dependencies: `react >= 18`, `react-native >= 0.76`, `@tanstack/react-query` 5.

---

## Quick start

The SDK takes one configuration object and two providers:

| Provider | Where | What it does |
|---|---|---|
| `ParadymWalletSdk.UnlockProvider` | App root | Holds the configuration and the lock state, and provides a `QueryClient` |
| `ParadymWalletSdk.AppProvider` | Below the point where the wallet is unlocked | Loads credentials and records, and enables the data hooks |

```tsx
// paradym.ts
import { LogLevel, type SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk'

export const paradymOptions: SetupParadymWalletSdkOptions = {
  id: 'my-wallet',
  logging: { level: LogLevel.Warn },
  trustMechanisms: [
    { trustMechanism: 'x509', trustedX509Entities: [/* see Trust */] },
    { trustMechanism: 'none', trustedEntities: [] },
  ],
}
```

```tsx
// App.tsx
import { activityIndexStore, deferredCredentialStorage, ParadymWalletSdk, useParadym } from '@paradym/wallet-sdk'
import { paradymOptions } from './paradym'

// Records the activity and deferred-credential hooks read from
const recordIds = [activityIndexStore.recordId, deferredCredentialStorage.recordId]

export default function App() {
  return (
    <ParadymWalletSdk.UnlockProvider configuration={paradymOptions}>
      <Gate />
    </ParadymWalletSdk.UnlockProvider>
  )
}

function Gate() {
  const paradym = useParadym()

  switch (paradym.state) {
    case 'initializing':
      return <Splash />
    case 'not-configured':
    case 'acquired-wallet-key':
      return <Onboarding />
    case 'locked':
      return <UnlockScreen />
    case 'unlocked':
      return (
        <ParadymWalletSdk.AppProvider recordIds={recordIds}>
          <Wallet />
        </ParadymWalletSdk.AppProvider>
      )
  }
}
```

Pass `queryClient` to `UnlockProvider` if the app already has a TanStack Query client.

---

## Wallet lifecycle

`useParadym()` returns the current state and the actions it allows. `useParadym('<state>')` narrows the type and throws when the wallet is in another state, so use it on screens that only render in that state.

```
initializing → not-configured → acquired-wallet-key → unlocked
               locked ─────────↗                        │
                 ↑──────────────── lock() ──────────────┘
```

| State | Actions |
|---|---|
| `initializing` | None. Moves to `not-configured` or `locked` on its own |
| `not-configured` | `setPin(pin)` |
| `acquired-wallet-key` | `unlock({ enableBiometrics })`, `reset()` |
| `locked` | `unlockUsingPin(pin)`, `tryUnlockingUsingBiometrics()`, `canTryUnlockingUsingBiometrics`, `isUnlocking`, `reset()` |
| `unlocked` | `paradym`, `lock()`, `reset()`, `enableBiometricUnlock()`, `disableBiometricUnlock()`, `unlockMethod` |

Every state except `initializing` also has `reinitialize()`.

### Onboarding

```tsx
function Onboarding() {
  const paradym = useParadym()

  if (paradym.state === 'not-configured') {
    // Derives the wallet key from the PIN. Moves to 'acquired-wallet-key'.
    return <PinInput onSubmit={(pin) => paradym.setPin(pin)} />
  }

  if (paradym.state === 'acquired-wallet-key') {
    // Creates the wallet. Pass `enableBiometrics: true` to store the key behind biometrics
    // and prompt for it once, so the user knows it works.
    return <Button onPress={() => paradym.unlock({ enableBiometrics: true })} title="Finish" />
  }

  return null
}
```

### Unlocking

```tsx
import { ParadymWalletAuthenticationInvalidPinError, useParadym } from '@paradym/wallet-sdk'

function UnlockScreen() {
  const { unlockUsingPin, tryUnlockingUsingBiometrics, canTryUnlockingUsingBiometrics } = useParadym('locked')

  useEffect(() => {
    if (canTryUnlockingUsingBiometrics) void tryUnlockingUsingBiometrics()
  }, [])

  return <PinInput onSubmit={(pin) => unlockUsingPin(pin)} />
}
```

`unlockUsingPin` and `tryUnlockingUsingBiometrics` move the wallet to `acquired-wallet-key`. Call `unlock()` in that state to open the store. It throws `ParadymWalletAuthenticationInvalidPinError` when the PIN was wrong, and the wallet goes back to `locked`.

Biometric unlock is turned off for the session when the user cancels the prompt or after repeated failures. Show the PIN pad when `canTryUnlockingUsingBiometrics` is `false`.

### Lock, reset and biometrics

```ts
const { lock, reset, enableBiometricUnlock, disableBiometricUnlock } = useParadym('unlocked')

await lock()                    // shuts down the agent, back to 'locked'
await reset()                   // deletes all wallet data, back to 'not-configured'
await enableBiometricUnlock()   // prompts once, then allows unlocking with biometrics
await disableBiometricUnlock()  // removes the biometric-protected key
```

`useCanUseBiometryBackedWalletKey()` tells you whether the device supports biometric unlock. `useIsBiometricsEnabled()` tells you whether the user turned it on.

---

## Configuration

`SetupParadymWalletSdkOptions`:

| Option | Default | Description |
|---|---|---|
| `id` | `'paradym-wallet'` | Base id of the wallet store. Don't change it after release: existing installs are stored under it |
| `trustMechanisms` | `[]` | How issuers and verifiers are identified and trusted. See [Trust](#trust) |
| `openId4VcConfiguration` | enabled | Options for the X.509 module, or `false` to disable OpenID4VC |
| `didcommConfiguration` | disabled | `{ label }` to enable DIDComm and AnonCreds |
| `getTrustedIssuersForVerification` | — | Credo callback for trust anchors. This is the only hook mdoc reader authentication uses |
| `logging` | console logger | See [Logging](#logging) |
| `locale` | `'en'` | BCP 47 tag that credentials render in. See [Internationalization](#internationalization) |
| `resolveAttributeLabel` | — | Labels for claims the issuer didn't name |
| `resolveDcApiDisplay` | English fallbacks | Text the OS credential picker shows |
| `resolveCredentialKeyOptions` | `askar` backend, issuer's first algorithm | Backend and key type for the key a received credential is bound to. See [Credential keys](#credential-keys) |

### Trust

When a credential offer or presentation request comes in, the SDK detects the mechanism it uses (`eudi_rp_authentication`, `x509`, `did`, or `none`). Then it looks up the matching entry in `trustMechanisms`. The result shows up as `trustMechanism` and `trustedEntities` on resolved offers and requests, so your UI can show who is asking and who vouches for them.

If an offer or request uses a mechanism you didn't configure, resolving it throws. Add a `none` entry to accept parties the wallet can't place.

```ts
import type { SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk'

const trustMechanisms: SetupParadymWalletSdkOptions['trustMechanisms'] = [
  // EUDI relying party registration certificates, checked against a trust list
  { trustMechanism: 'eudi_rp_authentication', trustList, trustedX509Entities },

  // Signed requests and issuer metadata with an x5c chain
  {
    trustMechanism: 'x509',
    trustedX509Entities: [
      {
        entityId: 'https://issuer.example.com',
        name: 'Example Issuer',
        logoUri: 'https://issuer.example.com/logo.png',
        url: 'https://issuer.example.com',
        certificate: 'MIIBzzCC...', // base64 DER
      },
    ],
  },

  // DID-signed requests and issuer metadata
  { trustMechanism: 'did', trustedDidEntities: [{ did: 'did:web:example.com', entityId, name, logoUri, url }] },

  // Unsigned issuers, and verifiers identified only by origin or redirect_uri
  { trustMechanism: 'none', trustedEntities: [{ issuer: 'https://issuer.example.com', entityId, name, logoUri, url }] },

  // The wallet itself, listed as a trusted party where relevant
  { walletTrustedEntity: { entityId: 'my-wallet', organizationName: 'My Wallet', logoUri, uri: 'https://example.com' } },
]
```

The certificates in the `x509` entry also become the agent's trusted roots for credential verification. You don't need to list them again in `openId4VcConfiguration`.

### Verification callbacks

To decide trust per verification, rather than from a fixed root list, register a callback:

```ts
const options: SetupParadymWalletSdkOptions = {
  openId4VcConfiguration: {
    // X.509 chains in credentials and signed authorization requests
    getTrustedCertificatesForVerification: (agentContext, { certificateChain, verification }) => {
      if (verification.type === 'credential') return [myIssuerRootPem]
      return undefined // fall back to the trusted roots
    },
  },

  // Mdoc reader authentication (ISO 18013-7 Annex C) only reaches this callback
  getTrustedIssuersForVerification: async (agentContext, { signer, verification }) => {
    if (verification.type !== 'mdocReaderAuth' || signer.method !== 'x509') return undefined
    return { trustedIssuers: [{ method: 'x509', issuance: [readerRootPem] }] }
  },
}
```

Return `undefined` for the cases you don't handle. The SDK then falls back to the next source.

### Logging

```ts
import { LogLevel } from '@paradym/wallet-sdk'

logging: {
  level: __DEV__ ? LogLevel.Trace : LogLevel.Warn,
  trace: true,       // keep recent messages in memory so they can be exported
  traceLimit: 1000,  // ring buffer size
  customLogger: MyLogger,
}
```

Credo logs whole records and payloads at `Trace` and `Debug`, and serializing them is expensive. Keep production builds at `Warn` or above.

Export traced messages, for example from a "send logs" button:

```ts
import { ParadymWalletSdkConsoleLogger } from '@paradym/wallet-sdk'

if (paradym.logger instanceof ParadymWalletSdkConsoleLogger) {
  const json = paradym.logger.loggedMessageContents // JSON array, oldest first
}
```

To forward logs elsewhere, for example to Sentry, extend the console logger. Extending it keeps console output and tracing working:

```ts
import { type LogLevel, ParadymWalletSdkConsoleLogger } from '@paradym/wallet-sdk'

export class MyLogger extends ParadymWalletSdkConsoleLogger {
  public constructor(level: LogLevel) {
    super(level)
  }

  public error(message: string, data?: Record<string, unknown>) {
    Sentry.captureMessage(message, { extra: data })
    super.error(message, data)
  }
}
```

You can also implement `ParadymWalletSdkLogger` (Credo's `BaseLogger`) from scratch. A custom logger that doesn't extend the console logger doesn't support `trace`.

---

## Key security

### The wallet key

All wallet data (credentials, keys, activity) lives in an encrypted [Askar](https://github.com/openwallet-foundation/askar) store. The key that opens it is never stored in plain form:

1. On `setPin`, the SDK generates a random 32-byte salt and keeps it in the platform keychain.
2. It runs the PIN and salt through Argon2id with the RFC 9106 parameters (64 MiB memory, 8 iterations, parallelism 4). The resulting hash seeds the store's raw key.
3. Opening the store is the PIN check. A wrong PIN produces a key that doesn't open the store, which the SDK reports as `ParadymWalletAuthenticationInvalidPinError`.

The SDK doesn't limit PIN attempts. Add a delay or attempt limit in your unlock screen.

### Biometric unlock

When biometrics are enabled, the derived wallet key is stored in the keychain with these settings:

- Hardware-backed storage: Secure Enclave on iOS, TEE or StrongBox on Android.
- Only the biometrics enrolled now can read it. Enrolling a new fingerprint or face invalidates it, and the user has to unlock with their PIN.
- No fallback to the device passcode.
- Readable only on this device, and only while a device passcode is set.

On Android this needs API 30 or higher. On older versions, `canUseBiometryBackedWalletKey()` returns `false` and the wallet uses the PIN only.

### Credential keys

The agent has three key management backends:

| Backend | Where keys live | Used for |
|---|---|---|
| `askar` (default) | Inside the encrypted wallet store | Most credential binding keys, DIDs |
| `secureEnvironment` | Secure Enclave / Android Keystore, via `@animo-id/expo-secure-environment` | Hardware-bound credentials, such as a PID |
| RSA verification | None (verify only) | Checking RSA-signed issuer chains |

By default, received credentials are bound to `askar` keys. When the issuer supports batch issuance, the SDK requests up to 10 copies of the credential, each with its own key.

To choose the key yourself, set `resolveCredentialKeyOptions`. It's called once for each credential configuration the wallet requests, with the options Credo passes to its credential binding resolver: the credential configuration (`format`, `vct`, `doctype`), the issuer metadata and the accepted proof types. It returns an object, and every field in it is optional:

| Field | Default | Description |
|---|---|---|
| `backend` | `'askar'` | Key management backend the key is created in |
| `algorithm` | First algorithm the issuer supports | JWA signature algorithm, which sets the key type: `ES256` (P-256) or `EdDSA` (Ed25519). It must be in `proofTypes.jwt.supportedSignatureAlgorithms`. The secure environment only supports `ES256` |

Return `undefined` to use the defaults.

```ts
import type { ResolveCredentialKeyOptions } from '@paradym/wallet-sdk'

const hardwareBound = {
  vcts: ['urn:eudi:pid:1'],
  doctypes: ['eu.europa.ec.eudi.pid.1', 'org.iso.18013.5.1.mDL'],
}

const resolveCredentialKeyOptions: ResolveCredentialKeyOptions = ({ credentialConfiguration: config, proofTypes }) => {
  const isHardwareBound =
    config.format === 'mso_mdoc'
      ? hardwareBound.doctypes.includes(config.doctype)
      : (config.format === 'dc+sd-jwt' || config.format === 'vc+sd-jwt') && hardwareBound.vcts.includes(config.vct ?? '')

  if (isHardwareBound) return { backend: 'secureEnvironment', algorithm: 'ES256' }

  // Prefer Ed25519 keys for everything else, when the issuer accepts them
  if (proofTypes.jwt?.supportedSignatureAlgorithms.includes('EdDSA')) return { algorithm: 'EdDSA' }

  return undefined
}
```

If the returned algorithm isn't one the issuer supports, the request fails with an error.

The callback may be async, for example to check whether the device has a secure element first. It applies to every OpenID4VCI flow, including `acquireCredentials` and the lower-level `receiveCredentialFromOpenId4VciOffer`.

Hardware keys can't be exported or backed up. When the app is uninstalled or the wallet is reset, these credentials have to be issued again.

> [!NOTE]
> Issuers that require key attestations aren't supported yet. Offers that require them fail with an error.

---

## Internationalization

The SDK renders credential names, claim labels and dates in one locale per process. It defaults to `'en'`.

Set the starting locale with `locale`. Update it with `paradym.setLocale` when the user changes language. Call it during render rather than in an effect, so the components below it render in the new language in that same pass:

```tsx
function useSyncSdkLocale(locale: string) {
  const paradym = useParadym()
  if (paradym.state === 'unlocked') paradym.paradym.setLocale(locale)
}
```

Credential displays are cached per locale, and the hooks re-render when it changes.

### Claim labels

When an issuer supplies its own label for a claim, the SDK uses it. For claims without one, you can supply a label with `resolveAttributeLabel`. Return `undefined` to let the SDK format the key itself (`birth_date` becomes "Birth date"):

```ts
import type { ResolveAttributeLabel } from '@paradym/wallet-sdk'

const resolveAttributeLabel: ResolveAttributeLabel = (context) => {
  // context: { key, path, format, plus docType, vct, types or schemaId depending on format }
  if (context.key === 'birth_date') return i18n.t('Date of birth')
  if (context.format === 'mso_mdoc' && context.docType === 'org.iso.18013.5.1.mDL') return mdlLabels[context.key]
  return undefined
}
```

The answer is cached per credential and locale. Only branch on the `context` and the current language.

### Credential picker text

When the SDK registers credentials with the [Digital Credentials API](#digital-credentials-api), it needs some fallback text. `resolveDcApiDisplay` is called on every registration, so it can return translated strings:

```ts
resolveDcApiDisplay: () => ({
  displayTitleFallback: i18n.t('Unknown card'),
  displaySubtitle: (issuerName) => i18n.t('Issued by {issuerName}', { issuerName }),
  displaySubtitleFallback: i18n.t('Unknown issuer'),
}),
```

> [!NOTE]
> The OS biometric prompt shown when unlocking is English only for now ("Unlock wallet").

---

## Reading data

These hooks work anywhere below `AppProvider`.

| Hook | Returns |
|---|---|
| `useCredentials({ credentialCategory?, removeCanonicalRecords? })` | `{ credentials: CredentialForDisplay[], isLoading }` |
| `useCredentialById(id)` | One `CredentialForDisplay` |
| `useCredentialByCategory(category)` | The main credential of a category, for example `'pid'` |
| `useMdocRecords()` / `useSdJwtVcRecords()` | Raw Credo records |
| `useActivities({ filters?, limit? })` | Issuance, presentation and signing history |
| `useActivityById(id)` | One activity |
| `useInboxNotifications()` / `useHasInboxNotifications()` | Pending DIDComm offers and requests, and deferred credentials |
| `useRefreshedDeferredCredentials()` | Fetches deferred credentials that are due. Mount it once |

`CredentialForDisplay` is the type to render: `display` (name, colors, background image, issuer), `attributes` (formatted and ordered), `metadata` (type, issuer, validity), plus the underlying `record`. Ids are prefixed by format (`sd-jwt-vc-…`, `mdoc-…`, `w3c-credential-…`, `w3c-v2-credential-…`).

```ts
await paradym.deleteCredentials({ credentialIds: [credential.id] }) // returns { success } instead of throwing
```

---

## Receiving credentials

OpenID4VCI goes through `paradym.openid4vc`.

```ts
const { paradym } = useParadym('unlocked')

// 1. Resolve the offer from a QR code or deep link
const offer = await paradym.openid4vc.resolveCredentialOffer({
  offerUri,
  authorization: { clientId: 'my-wallet', redirectUri: 'mywallet://redirect' }, // only needed for the auth flows
})

// offer.flow: 'pre-auth' | 'pre-auth-with-tx-code' | 'auth' | 'auth-presentation-during-issuance'
// offer.credentialDisplay, offer.issuer and offer.trustedEntities describe what's offered and by whom
```

`acquireCredentials` picks the flow from the options you pass:

```ts
// Pre-authorized, optionally with a transaction code
const result = await paradym.openid4vc.acquireCredentials({
  resolvedCredentialOffer: offer.resolvedCredentialOffer,
  transactionCode, // for 'pre-auth-with-tx-code'
})

// Authorization code: open offer.resolvedAuthorizationRequest.authorizationRequestUrl in a browser,
// then pass the code from the redirect
const result = await paradym.openid4vc.acquireCredentials({
  resolvedCredentialOffer: offer.resolvedCredentialOffer,
  resolvedAuthorizationRequest: offer.resolvedAuthorizationRequest,
  authorization: { clientId, redirectUri },
  authorizationCode,
})

// Presentation during issuance: the issuer asks for a credential first
const result = await paradym.openid4vc.acquireCredentials({
  resolvedCredentialOffer: offer.resolvedCredentialOffer,
  resolvedAuthorizationRequest: offer.resolvedAuthorizationRequest,
  credentialsForRequest: offer.credentialsForProofRequest,
  authorization: { clientId, redirectUri },
})
```

A wrong transaction code throws `ParadymWalletInvalidTransactionCodeError`.

Credentials aren't stored until the user accepts them. `result` contains either `credentials` (ready to show) or `deferredCredentials` (the issuer delivers later):

```ts
await paradym.openid4vc.completeCredentialRetrieval({
  resolvedCredentialOffer: offer.resolvedCredentialOffer,
  recordToStore: result.credentials[0] && { credentialRecord: result.credentials[0].record },
  deferredCredential: result.deferredCredentials[0],
})
```

This stores the credential, adds an activity entry, and registers the credential with the Digital Credentials API. Deferred credentials are fetched later by `useRefreshedDeferredCredentials`.

---

## Presenting credentials

### OpenID4VP

```ts
const request = await paradym.openid4vc.resolveCredentialRequest({ uri })

request.verifier           // { entityId, name, logo, hostName, trustedEntities }
request.trustMechanism     // how the verifier was identified
request.formattedSubmission // what's asked for, and which credentials match
request.transactionData    // set when the verifier asks to sign a transaction

// The user accepts
await paradym.openid4vc.shareCredentials({ resolvedRequest: request, selectedCredentials: {} })

// The user declines (logged in the activity history)
await paradym.openid4vc.declineCredentialRequest({ resolvedRequest: request })
```

`formattedSubmission.entries` has one entry per requested credential. Entries with `isSatisfied: true` list the matching `credentials` and the attributes that would be `disclosed`. When `areAllSatisfied` is `false`, the wallet can't answer the request. Use the [display helpers](#display-helpers) to explain what's missing.

Pass `acceptTransactionData: true` when the user approved a transaction, for example a QES authorization.

### Digital Credentials API

The SDK registers SD-JWT VC and mdoc credentials with the OS credential manager. On Android this goes through Credential Manager. On iOS only mdocs are registered, with the identity document provider. Credentials received through `completeCredentialRetrieval` are registered automatically. To register the full set, for example on startup:

```ts
useEffect(() => {
  void paradym.dcApi.registerCredentials({})
}, [paradym])
```

Registration is skipped when nothing has changed, and it never throws. Errors are logged.

Browsers send requests to a separate entry point: an Android activity or an iOS app extension. That entry point can't load the full SDK, so use `ParadymDcApiSdk` there, a lighter instance of the same wallet. Pass it the same options object as the app, so it trusts exactly the same parties:

```ts
import { getWalletKeyUsingPin, getWalletKeyVersion, ParadymDcApiSdk } from '@paradym/wallet-sdk/dc-api'

const walletKey = await getWalletKeyUsingPin(pin, getWalletKeyVersion())
const sdk = await ParadymDcApiSdk.initialize({ ...paradymOptions, walletKey, locale })

const review = await sdk.reviewRequest(request) // request from @animo-id/expo-digital-credentials-api
// review.verifier, review.submission, review.trustMechanism
await review.share() // or review.decline()
await sdk.shutdown()
```

Import from `@paradym/wallet-sdk/dc-api` rather than the package root. The root pulls in DIDComm, AnonCreds and react-query, which the extension can't load. The `dc-api` entry also exports the SDK errors, `getWalletKeyUsingBiometrics`, `getIsBiometricsEnabled`, the submission types, and the display helpers for showing what a request is missing.

On iOS the store, the settings and the keychain items have to be readable by the extension. Configure the `@animo-id/expo-digital-credentials-api` config plugin with an `appGroup` and a `keychainAccessGroup`. When the shared container exists, the SDK moves the store into it on the next unlock.

### Proximity (ISO 18013-5)

To match an mdoc device request received over BLE or NFC against the wallet:

```ts
const submission = await paradym.proximity.getSubmissionForMdocDocumentRequest({ encodedDeviceRequest })
```

The SDK doesn't handle the transport or the session yet.

---

## DIDComm

Enable it with `didcommConfiguration: { label: 'My Wallet' }`. This adds DIDComm v1/v2 credential and proof protocols, AnonCreds, and the cheqd, did:web and did:webvh registries.

```ts
const { paradym } = useParadym('unlocked', 'didcomm')

const result = await paradym.resolveDidCommInvitation(invitationUrl)
if (!result.success) throw new Error(result.message)

result.flowType // 'issue' | 'verify' | 'connect'
```

Then use `useDidCommConnectionActions(result)`, `useDidCommCredentialActions(credentialExchangeId)` or `useDidCommPresentationActions(proofExchangeId)` to accept or decline.

`paradym.isDidCommEnabled` and `paradym.isOpenId4VcEnabled` report which protocols are active.

---

## Errors

OpenID4VC, DC API and unlock methods throw. `resolveDidCommInvitation` and `deleteCredentials` return `{ success: true, ... } | { success: false, message }` instead.

| Error | When |
|---|---|
| `ParadymWalletAuthenticationInvalidPinError` | Wrong PIN; the key doesn't open the store |
| `ParadymWalletBiometricAuthenticationError` | Biometric prompt failed |
| `ParadymWalletBiometricAuthenticationCancelledError` | User cancelled the biometric prompt |
| `ParadymWalletBiometricAuthenticationNotEnabledError` | No biometrics enrolled on the device |
| `ParadymWalletInvalidTransactionCodeError` | Issuer rejected the transaction code |
| `ParadymWalletNoStoreError` | `ParadymDcApiSdk` was opened before the app ever ran |
| `ParadymWalletInvitation*Error` | Invitation couldn't be parsed, was already used, or uses an unsupported protocol |
| `ParadymWalletMustBeAgentTypeError` | DIDComm or OpenID4VC method called while that protocol is disabled |

All of them extend `ParadymWalletSdkError`.

---

## Escape hatches

`paradym.agent` is the underlying [Credo](https://credo.js.org) agent, for anything the SDK doesn't wrap. Narrow its type with `useParadym('unlocked', 'openid4vc' | 'didcomm' | 'full')`.

### Display helpers

The package root also exports the building blocks the SDK uses internally, so you can build your own screens:

- `getCredentialForDisplay(record)` and `getCredentialForDisplayId(record)`
- `formatAllAttributes`, `formatAttributesAtPaths`, `pickAttributesAtPaths`
- `getDisclosedAttributeNamesForDisplay`, `getUnsatisfiedAttributePathsForDisplay`, `hasMissingCards`, `getClosestPartialMatch`
- `parseInvitationUrl` / `parseInvitationUrlSync`, to tell offers, requests and DIDComm invitations apart

---

## Contributing

Is there something you'd like to fix or add? We love community contributions! See our [contribution guidelines](./CONTRIBUTING.md) to get started.

## License

This project is licensed under the Apache License Version 2.0 (Apache-2.0).
