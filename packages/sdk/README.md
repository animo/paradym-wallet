<p align="center">
  <picture>
   <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-light-no-text_ok9auy.svg">
   <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-dark-no-text_fqqdq9.svg">
   <img alt="Animo Logo" height="250px" />
  </picture>
</p>

<h1 align="center"><b>Paradym Wallet SDK — TypeScript</b></h1>

A React Native library enabling wallets to easily receive, store, and prove digital credentials according to the OpenID4VC and DIDComm suite of specifications.

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
  <a href="#setup">Setup</a>
  &nbsp;|&nbsp;
  <a href="#wallet-states">Wallet States</a>
  &nbsp;|&nbsp;
  <a href="#usage">Usage</a>
  &nbsp;|&nbsp;
  <a href="#contributing">Contributing</a>
  &nbsp;|&nbsp;
  <a href="#license">License</a>
</p>

---

## Installation

```bash
npm install @paradym/wallet-sdk
# or
yarn add @paradym/wallet-sdk
# or
pnpm add @paradym/wallet-sdk
```

> [!IMPORTANT]
> **pnpm** also requires you to approve native builds:
> ```bash
> pnpm approve-builds @paradym/wallet-sdk
> ```

> [!IMPORTANT]
> Rebuild your application after installation — native dependencies are added.

---

## Setup

Two providers are required for the SDK to work correctly:

| Provider | Purpose |
|---|---|
| `ParadymWalletSdk.UnlockProvider` | Configures the SDK and manages wallet unlock state |
| `ParadymWalletSdk.AppProvider` | Exposes the SDK and record data throughout the app |

`UnlockProvider` must wrap `AppProvider` in the component tree.

### `UnlockProvider`

Wrap your application (or the root of your auth flow) with `UnlockProvider`. Pass your SDK configuration and, optionally, a custom `QueryClient` from `@tanstack/react-query`.

```typescript
import { ParadymWalletSdk } from '@paradym/wallet-sdk'

export default function App() {
  const sdkConfiguration = {
    // See Configuration section below
  }

  return (
    <ParadymWalletSdk.UnlockProvider configuration={sdkConfiguration}>
      {/* rest of the app */}
    </ParadymWalletSdk.UnlockProvider>
  )
}
```

#### Bring your own QueryClient

```typescript
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

<ParadymWalletSdk.UnlockProvider configuration={sdkConfiguration} queryClient={queryClient}>
  {/* ... */}
</ParadymWalletSdk.UnlockProvider>
```

### Configuration

The SDK is configured via the `SetupParadymWalletSdkOptions` object (equivalent to `SetupAgentOptions` plus `trustMechanisms`). All fields except `key` are part of this type — `key` is managed internally by the unlock flow.

```typescript
type SetupParadymWalletSdkOptions = {
  /**
   * Unique identifier for the wallet storage.
   * Defaults to 'paradym-wallet' if not provided.
   */
  id?: string

  /**
   * Configure logging behaviour.
   */
  logging?: {
    level: LogLevel
    /** Enable in-memory log tracing (retrieve via `paradym.logger.loggedMessageContents`) */
    trace?: boolean
    traceLimit?: number
    /** Custom logger class implementing ParadymWalletSdkLogger */
    customLogger?: new (logLevel: LogLevel) => ParadymWalletSdkLogger
  }

  /**
   * OpenID4VC configuration. Pass `false` to disable. Enabled by default.
   * Accepts X.509 module options (e.g. trustedCertificates).
   */
  openId4VcConfiguration?: { trustedCertificates?: string[] } | false

  /**
   * DIDComm configuration. Pass `false` to disable. Disabled by default.
   */
  didcommConfiguration?: { label: string } | false

  /**
   * Trust mechanisms evaluated in order — first match wins.
   */
  trustMechanisms?: TrustMechanismConfiguration[]
}
```

#### Trust Mechanisms

The SDK supports multiple trust mechanisms. They are evaluated in order — the first one that matches is used.

Available trust mechanism types: `eudi_rp_authentication`, `x509`, `did`.

```typescript
type TrustMechanismConfiguration =
  | { trustMechanism: 'eudi_rp_authentication'; trustList: TrustList; trustedX509Entities: TrustedX509Entity[] }
  | { trustMechanism: 'x509'; trustedX509Entities: TrustedX509Entity[] }
  | { trustMechanism: 'did' }
```

```typescript
type TrustedX509Entity = {
  name: string
  entityId: string
  logoUri: string
  certificate: string  // DER-encoded certificate
  url: string
  demo?: boolean
}
```

**Example: X.509 trust with verbose logging**

```typescript
import { ParadymWalletSdk, LogLevel } from '@paradym/wallet-sdk'

const sdkConfiguration = {
  logging: {
    level: LogLevel.trace,
    customLogger: MyCustomLogger,
  },
  trustMechanisms: [
    {
      trustMechanism: 'x509',
      trustedX509Entities: [
        {
          name: 'Animo',
          entityId: 'Animo',
          logoUri: 'https://funke.animo.id/icon.svg?1c394fbf8b148827',
          certificate: 'MIIBzzCC...', // your DER-encoded certificate
          url: 'https://funke.animo.id',
        },
      ],
    },
  ],
  openId4VcConfiguration: {
    trustedCertificates: [],
  },
}
```

### Custom Logger

Implement `ParadymWalletSdkLogger` to send logs to your own logging service (e.g. Sentry):

```typescript
import { ParadymWalletSdkLogger, LogData } from '@paradym/wallet-sdk'
import { loggingApi } from '@your-package/api'

export class MyCustomLogger implements ParadymWalletSdkLogger {
  private send(message: string, data?: LogData) {
    void loggingApi.upload(message, data)
  }

  fatal(message: string, data?: LogData) { this.send(message, data) }
  error(message: string, data?: LogData) { this.send(message, data) }
  warn(message: string, data?: LogData)  { this.send(message, data) }
  info(message: string, data?: LogData)  { this.send(message, data) }
  debug(message: string, data?: LogData) { this.send(message, data) }
  trace(message: string, data?: LogData) { this.send(message, data) }
}
```

To also keep console output, extend `ParadymWalletSdkConsoleLogger`:

```typescript
import { ParadymWalletSdkConsoleLogger, LogData } from '@paradym/wallet-sdk'

export class MyCustomAndConsoleLogger extends ParadymWalletSdkConsoleLogger {
  private send(message: string, data?: LogData) {
    void loggingApi.upload(message, data)
  }

  error(message: string, data?: LogData) { this.send(message, data); super.error(message, data) }
  // repeat for other levels...
}
```

### `AppProvider`

Place `AppProvider` inside `UnlockProvider`, at a point in the tree where the wallet is guaranteed to be in the `unlocked` state.

```typescript
import { ParadymWalletSdk } from '@paradym/wallet-sdk'

export default function AuthenticatedApp() {
  return (
    <ParadymWalletSdk.AppProvider recordIds={[]}>
      {/* screens that require an unlocked wallet */}
    </ParadymWalletSdk.AppProvider>
  )
}
```

---

## Wallet States

The SDK uses a state machine with five states. Use the `useParadym()` hook to access the current state and its associated methods.

```
initializing → not-configured → acquired-wallet-key → unlocked
                    ↑                                      |
                    └──────────────── locked ←─────────────┘
```

| State | Description |
|---|---|
| `initializing` | SDK is starting up; transitions automatically |
| `not-configured` | No wallet exists yet; user must set a PIN |
| `acquired-wallet-key` | PIN accepted, ready to create or open the wallet |
| `locked` | Wallet exists but is locked; requires PIN or biometrics |
| `unlocked` | Wallet is open and fully operational |

### Wallet State Types

The state union types are exported for use in TypeScript applications. Use `useParadym('<STATE>')` to access state-specific data — these types describe the shape of each state.

```typescript
import type {
  SecureUnlockReturn,
  SecureUnlockReturnInitializing,
  SecureUnlockReturnNotConfigured,
  SecureUnlockReturnWalletKeyAcquired,
  SecureUnlockReturnLocked,
  SecureUnlockReturnUnlocked,
  SecureUnlockState,
  UnlockMethod,
} from '@paradym/wallet-sdk'

type SecureUnlockState = 'initializing' | 'not-configured' | 'acquired-wallet-key' | 'locked' | 'unlocked'
type UnlockMethod = 'pin' | 'biometrics'

type SecureUnlockReturnInitializing = { state: 'initializing' }

type SecureUnlockReturnNotConfigured = {
  state: 'not-configured'
  setPin: (pin: string) => Promise<void>
  reinitialize: () => void
}

type SecureUnlockReturnWalletKeyAcquired = {
  state: 'acquired-wallet-key'
  unlockMethod: UnlockMethod
  unlock: (options?: { enableBiometrics: boolean }) => Promise<ParadymWalletSdk>
  reset: () => Promise<void>
  reinitialize: () => void
}

type SecureUnlockReturnLocked = {
  state: 'locked'
  canTryUnlockingUsingBiometrics: boolean
  isUnlocking: boolean
  reset: () => Promise<void>
  tryUnlockingUsingBiometrics: () => Promise<void>
  unlockUsingPin: (pin: string) => Promise<void>
  reinitialize: () => void
}

type SecureUnlockReturnUnlocked = {
  state: 'unlocked'
  paradym: ParadymWalletSdk
  unlockMethod: UnlockMethod
  lock: () => Promise<void>
  reset: () => Promise<void>
  reinitialize: () => void
  enableBiometricUnlock: () => Promise<void>
  disableBiometricUnlock: () => Promise<void>
}

type SecureUnlockReturn =
  | SecureUnlockReturnInitializing
  | SecureUnlockReturnNotConfigured
  | SecureUnlockReturnWalletKeyAcquired
  | SecureUnlockReturnLocked
  | SecureUnlockReturnUnlocked
```

### Strongly-typed state hooks with `useParadym`

`useParadym('<STATE_NAME>')` asserts the state and throws if it does not match, which is useful on screens that require a specific state:

```typescript
import { useParadym } from '@paradym/wallet-sdk'

// Throws if the wallet is not unlocked
const { paradym } = useParadym('unlocked')
```

---

## Usage

### Onboarding

#### 1. `not-configured` — Set a PIN

```typescript
import { useParadym } from '@paradym/wallet-sdk'
import { useState } from 'react'

export default function SetPinScreen() {
  const { setPin } = useParadym('not-configured')
  const [pin, setLocalPin] = useState('')

  const handleSubmit = async () => {
    if (pin.length !== 6) throw new Error('PIN must be 6 digits')
    await setPin(pin)
    // state transitions to 'acquired-wallet-key'
  }

  // render PIN input...
}
```

#### 2. `acquired-wallet-key` — Create the wallet

```typescript
import { useParadym } from '@paradym/wallet-sdk'

export default function FinishOnboardingScreen() {
  const { unlock } = useParadym('acquired-wallet-key')

  const handleUnlock = async () => {
    await unlock({ enableBiometrics: false })
    // state transitions to 'unlocked'
  }

  // render button...
}
```

### Unlocking

#### `locked` — Unlock with PIN

```typescript
import { useParadym } from '@paradym/wallet-sdk'
import { useState } from 'react'

export default function UnlockScreen() {
  const { unlockUsingPin, isUnlocking } = useParadym('locked')
  const [pin, setPin] = useState('')

  const handleSubmit = async () => {
    if (pin.length !== 6) throw new Error('PIN must be 6 digits')
    await unlockUsingPin(pin)
    // state transitions to 'unlocked'
  }

  // render PIN input...
}
```

#### `locked` — Unlock with Biometrics

```typescript
const { tryUnlockingUsingBiometrics, canTryUnlockingUsingBiometrics } = useParadym('locked')

if (canTryUnlockingUsingBiometrics) {
  await tryUnlockingUsingBiometrics()
}
```

> The SDK allows up to 3 failed biometric attempts before disabling this method. If the user cancels, biometric unlock is also disabled for the session.

### Managing Biometrics (Unlocked state)

```typescript
const { enableBiometricUnlock, disableBiometricUnlock } = useParadym('unlocked')

// Enable (typically called during onboarding)
await enableBiometricUnlock()

// Disable
await disableBiometricUnlock()
```

### Locking and Resetting

```typescript
const { lock, reset } = useParadym('unlocked')

// Lock the wallet (closes the agent)
await lock()

// Wipe all wallet data and return to 'not-configured'
await reset()
```

---

## Hooks

When `AppProvider` is mounted, the following hooks are available to access records and perform actions:

### `useCredentials(options?)`

Returns all stored credentials as `CredentialForDisplay[]`, sorted by creation date.

```typescript
import { useCredentials } from '@paradym/wallet-sdk'

const { credentials, isLoading } = useCredentials()
// optionally: useCredentials({ removeCanonicalRecords: false, credentialCategory: 'pid' })
```

### `useCredentialById(id)`

Returns a single `CredentialForDisplay` by its `CredentialForDisplayId`.

```typescript
import { useCredentialById } from '@paradym/wallet-sdk'

const credential = useCredentialById('sd-jwt-vc-abc123')
```

### `useCredentialByCategory(category)`

Returns the primary credential for a given category.

```typescript
import { useCredentialByCategory } from '@paradym/wallet-sdk'

const pidCredential = useCredentialByCategory('pid')
```

### `useActivities()`

Returns the wallet activity log (issuances and presentations).

```typescript
import { useActivities } from '@paradym/wallet-sdk'

const { activities, isLoading } = useActivities()
```

### `useInboxNotifications()` / `useHasInboxNotifications()`

Returns pending inbox notifications (e.g. deferred credentials that are ready).

```typescript
import { useInboxNotifications, useHasInboxNotifications } from '@paradym/wallet-sdk'

const { notifications } = useInboxNotifications()
const hasNotifications = useHasInboxNotifications()
```

### `useRefreshedDeferredCredentials()`

Periodically checks for and fetches deferred credentials that are now available.

### DIDComm hooks

```typescript
import {
  useDidCommConnectionActions,
  useDidCommCredentialActions,
  useDidCommPresentationActions,
} from '@paradym/wallet-sdk'
```

---

## Key Types

### `CredentialForDisplay`

The primary type for rendering credentials in UI. Returned by `useCredentials()`, `useCredentialById()`, and `useCredentialByCategory()`.

```typescript
type CredentialForDisplayId =
  | `w3c-credential-${string}`
  | `sd-jwt-vc-${string}`
  | `mdoc-${string}`
  | `w3c-v2-credential-${string}`

interface CredentialForDisplay {
  id: CredentialForDisplayId
  createdAt: Date
  display: CredentialDisplay        // name, colors, background image, issuer info
  attributes: FormattedAttribute[]  // display-ordered attribute list
  rawAttributes: Record<string, unknown>
  metadata: CredentialMetadata      // type, issuer, holder, validity dates
  claimFormat: ClaimFormat
  record: CredentialRecord          // underlying Credo record
  category?: CredentialCategoryMetadata
  hasRefreshToken: boolean
}

interface CredentialDisplay {
  name?: string
  description?: string
  textColor?: string
  backgroundColor?: string
  backgroundImage?: DisplayImage
  issuer: CredentialIssuerDisplay
}

interface CredentialIssuerDisplay {
  name?: string
  domain?: string
  logo?: DisplayImage
}
```

### `FormattedSubmission`

Returned by `paradym.openid4vc.resolveCredentialRequest()`. Use this to render the presentation request UI.

```typescript
interface FormattedSubmission {
  name?: string
  purpose?: string
  areAllSatisfied: boolean
  entries: FormattedSubmissionEntry[]
}

type FormattedSubmissionEntry =
  | {
      isSatisfied: false
      inputDescriptorId: string
      name?: string
      description?: string
      requestedAttributePaths: Array<Array<string | number | null | AnonCredsRequestedPredicate>>
    }
  | {
      isSatisfied: true
      inputDescriptorId: string
      name?: string
      description?: string
      credentials: FormattedSubmissionEntrySatisfiedCredential[]
    }

interface FormattedSubmissionEntrySatisfiedCredential {
  credential: CredentialForDisplay
  disclosed: {
    rawAttributes: Record<string, unknown>
    attributes: FormattedAttribute[]
    metadata: CredentialMetadata
    paths: (string | AnonCredsRequestedPredicate)[][]
  }
}
```

### `Activity`

Returned by `useActivities()`. A discriminated union on `type`:

```typescript
import type {
  Activity,
  IssuanceActivity,
  PresentationActivity,
  PresentationActivityCredential,
  PresentationActivityCredentialNotFound,
  SignedActivity,
} from '@paradym/wallet-sdk'

type ActivityType = 'shared' | 'received' | 'signed'
type SharingFailureReason = 'missing_credentials' | 'unknown'

// Credential found in wallet and shared
interface PresentationActivityCredential {
  /** If not defined, it means it's 'v1'. Starting from v2 the full mdoc attributes structure is stored. */
  version?: 'v2'
  id: CredentialForDisplayId
  name?: string
  attributeNames: string[]
  attributes: Record<string, unknown>
  metadata: Record<string, unknown>
}

// Requested credential not found in wallet
interface PresentationActivityCredentialNotFound {
  name?: string
  attributeNames: string[]
}

interface IssuanceActivity {
  id: string
  type: 'received'
  status: 'success' | 'failed' | 'stopped' | 'pending'
  date: string  // ISO 8601
  entity: { id?: string; host?: string; name?: string; logo?: DisplayImage; backgroundColor?: string }
  credentialIds: CredentialForDisplayId[]
  deferredCredentials?: CredentialDisplay[]
}

interface PresentationActivity {
  id: string
  type: 'shared'
  status: 'success' | 'failed' | 'stopped'
  date: string
  entity: { id?: string; host?: string; name?: string; logo?: DisplayImage; backgroundColor?: string }
  request: {
    name?: string
    purpose?: string
    credentials: Array<PresentationActivityCredential | PresentationActivityCredentialNotFound>
    failureReason?: SharingFailureReason
  }
}

interface SignedActivity extends Omit<PresentationActivity, 'type'> {
  type: 'signed'
  transaction: FormattedTransactionData
}

type Activity = PresentationActivity | IssuanceActivity | SignedActivity
```

### `ResolveCredentialOfferReturn`

Returned by `paradym.openid4vc.resolveCredentialOffer()`. A discriminated union on `flow`:

```typescript
type ResolveCredentialOfferReturn =
  | {
      flow: 'pre-auth'
      resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
      credentialDisplay: CredentialDisplay
    }
  | {
      flow: 'pre-auth-with-tx-code'
      resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
      credentialDisplay: CredentialDisplay
      txCodeInfo: { description?: string; length?: number; input_mode?: 'numeric' | 'text' }
    }
  | {
      flow: 'auth'
      resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
      credentialDisplay: CredentialDisplay
      resolvedAuthorizationRequest: OpenId4VciResolvedOauth2RedirectAuthorizationRequest
    }
  | {
      flow: 'auth-presentation-during-issuance'
      resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
      credentialDisplay: CredentialDisplay
      resolvedAuthorizationRequest: OpenId4VciResolvedAuthorizationRequest
      credentialsForProofRequest: CredentialsForProofRequest
    }
```

---

## OpenID4VC

Access all OpenID4VC methods through `paradym.openid4vc`.

### Receiving a Credential (QR / Deeplink)

```typescript
import { useParadym } from '@paradym/wallet-sdk'
import { useState } from 'react'

export default function ScanScreen() {
  const { paradym } = useParadym('unlocked')
  const [offer, setOffer] = useState()

  const onScanned = async (uri: string) => {
    const resolved = await paradym.openid4vc.resolveCredentialOffer({ offerUri: uri })
    setOffer(resolved)
  }

  if (offer) return <AcquireCredentialScreen offer={offer.resolvedCredentialOffer} />
  // render camera...
}

function AcquireCredentialScreen({ offer }) {
  const { paradym } = useParadym('unlocked')

  const handleAcquire = async () => {
    const { credentials } = await paradym.openid4vc.acquireCredentials({
      resolvedCredentialOffer: offer,
    })
    // credentials[0].record is available here
    await paradym.openid4vc.completeCredentialRetrieval({
      resolvedCredentialOffer: offer,
      record: credentials[0].record,
    })
  }

  // render UI...
}
```

### Receiving a Deferred Credential

For issuers that do not deliver credentials immediately:

```typescript
await paradym.openid4vc.receiveDeferredCredential({ /* options */ })
```

### Sharing a Credential (Presentation)

```typescript
const resolved = await paradym.openid4vc.resolveCredentialRequest({ uri })

const response = await paradym.openid4vc.shareCredentials({
  resolvedRequest: resolved,
  selectedCredentials: {}, // map query keys to credential IDs
})
```

### Declining a Credential Request

```typescript
await paradym.openid4vc.declineCredentialRequest({ /* options */ })
```

---

## Digital Credentials API (DC API)

Access DC API methods through `paradym.dcApi`.

```typescript
const { paradym } = useParadym('unlocked')

// Register credentials with the browser DC API
await paradym.dcApi.registerCredentials({ /* options */ })

// Resolve an incoming DC API request
const resolved = await paradym.dcApi.resolveRequest({ /* options */ })

// Respond to the request
await paradym.dcApi.sendResponse({ /* options */ })

// Send an error response
paradym.dcApi.sendErrorResponse(/* options */)
```

---

## ISO/IEC 18013-5 Proximity (mDoc/mDL)

Access proximity flow utilities through `paradym.proximity`.

```typescript
const { paradym } = useParadym('unlocked')

const submission = await paradym.proximity.getSubmissionForMdocDocumentRequest({
  // options
})
```

---

## DIDComm

```typescript
const { paradym } = useParadym('unlocked')

const result = await paradym.resolveDidCommInvitation(invitationUrlOrObject)

if (result.success) {
  // use result.outOfBandRecord, result.connectionRecord, etc.
}
```

> `isDidCommEnabled` and `isOpenId4VcEnabled` on the SDK instance can be used to check which protocols are active.

---

## Managing Credentials

### Delete credentials

```typescript
await paradym.deleteCredentials({
  credentialIds: ['credential-id-1', 'credential-id-2'],
})
```

---

## Error Handling

The SDK exports typed error classes for handling authentication failures:

```typescript
import {
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationError,
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletBiometricAuthenticationNotEnabledError,
} from '@paradym/wallet-sdk'

try {
  await unlock({ enableBiometrics: false })
} catch (error) {
  if (error instanceof ParadymWalletAuthenticationInvalidPinError) {
    // Wrong PIN — prompt retry
  } else if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
    // User cancelled biometric prompt
  } else if (error instanceof ParadymWalletBiometricAuthenticationNotEnabledError) {
    // Biometrics not set up on device
  }
}
```

All error classes extend `ParadymWalletSdkError` which extends `Error`.

---

## SDK Instance API

| Property / Method | Description |
|---|---|
| `paradym.agent` | The underlying Credo agent instance |
| `paradym.walletId` | The wallet's unique identifier |
| `paradym.logger` | The configured logger |
| `paradym.isDidCommEnabled` | Whether DIDComm is configured |
| `paradym.isOpenId4VcEnabled` | Whether OpenID4VC is configured |
| `paradym.initialize()` | Initialize the agent (called internally) |
| `paradym.shutdown()` | Shut down the agent and close the wallet |
| `paradym.reset()` | Wipe all wallet data |

---

## Return Type Convention

Most SDK methods return a `ParadymWalletSdkResult<T>`:

```typescript
type ParadymWalletSdkResult<T> =
  | ({ success: true } & T)
  | { success: false; message: string; cause?: string }
```

Always check `result.success` before using the returned data.

---

## Contributing

Is there something you'd like to fix or add? We love community contributions! See our [contribution guidelines](./CONTRIBUTING.md) to get started.

## License

This project is licensed under the Apache License Version 2.0 (Apache-2.0).
