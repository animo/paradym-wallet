<p align="center">
  <picture>
   <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-light-no-text_ok9auy.svg">
   <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/animo-solutions/image/upload/v1656578320/animo-logo-dark-no-text_fqqdq9.svg">
   <img alt="Animo Logo" height="250px" />
  </picture>
</p>

<h1 align="center" ><b>Paradym Wallet SDK - TypeScript</b></h1>

A React Native library enabling wallets to easily receive, store and prove digital credentials according to the openid4vc and didcomm suite of specifications.


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
  <a href="#usage">Usage</a> 
  &nbsp;|&nbsp;
  <a href="#contributing">Contributing</a>
  &nbsp;|&nbsp;
  <a href="#license">License</a>
  &nbsp;|&nbsp;
  <a href="#credits">Credits</a>
</p>

## Installation

```bash
npm install @paradym/wallet-sdk
# or 
yarn add @paradym/wallet-sdk
# or
pnpm add @paradym/wallet-sdk
```

> [!IMPORTANT]
> pnpm also requires you to approve native builds.
> This can be done with the following command
> `pnpm approve-builds @paradym/wallet-sdk`

> [!IMPORTANT]
> Also, make sure to rebuild the application as native dependencies are added.

## Setup

When the SDK is installed, you will need to add **two** providers to make sure everything works properly.
The first one is the `ParadymWalletSdk.UnlockProvider` and the second one is the `ParadymWalletSdk.AppProvider`.

### `UnlockProvider`

The `ParadymWalletSdk.UnlockProvider` is used to configure the SDK and to unlock the internal wallet which allows the SDK to interact with the stored credentials.
Make sure this provider is on a higher level then the `ParadymWalletSdk.AppProvider`.

#### Configuration

The SDK allows for some configuration to, for example, set the logging level, whether you want to support didcomm and/or openid4vc.
Multiple trust mechanisms are available which includes `eudi_rp_authentication`, `openid_federation`, `x509` and `did`.



#### Example

This an example of a configuration which uses quite verbose logging and trusts the [Animo Playground](https://funke.animo.id) via an X.509 certificate.

```typescript
import { ParadymWalletSdk, LogLevel } from '@paradym/wallet-sdk'
import { ParadymWalletSdkCustomLogger } from '@your-package/custom-logger'

export default App() {
    const sdkConfiguration = { 
        logging: { 
            level: LogLevel.trace,
            customLogger: ParadymWalletSdkCustomLogger
        },
        trustMechanisms: [{ 
            trustMechanism: 'x509',
            trustedX509Entities: [{
                name: 'Animo',
                entityId: 'Animo',
                logoUri: 'https://funke.animo.id/icon.svg?1c394fbf8b148827',
                certificate: 'MIIBzzCCAXWgAwIBAgIQVwAFolWQim94gmyCic3bCTAKBggqhkjOPQQDAjAdMQ4wDAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwHhcNMjQwNTAyMTQyMzMwWhcNMjgwNTAyMTQyMzMwWjAdMQ4wDAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQC/YyBpcRQX8ZXpHfra1TNdSbS7qzgHYHJ3msbIr8TJLPNZI8Ul8zJlFdQVIVls5+5ClCbN+J9FUvhPGs4AzA+o4GWMIGTMB0GA1UdDgQWBBQv3zBo1i/1CfEgdvkIWDGO9lS1SzAOBgNVHQ8BAf8EBAMCAQYwIQYDVR0SBBowGIYWaHR0cHM6Ly9mdW5rZS5hbmltby5pZDASBgNVHRMBAf8ECDAGAQH/AgEAMCsGA1UdHwQkMCIwIKAeoByGGmh0dHBzOi8vZnVua2UuYW5pbW8uaWQvY3JsMAoGCCqGSM49BAMCA0gAMEUCIQCTg80AmqVHJLaZt2uuhAtPqKIXafP2ghtd9OCmdD51ZwIgKvVkrgTYlxSRAbmKY6MlkH8mM3SNcnEJk9fGVwJG++0=',
                url: 'https://funke.animo.id'
            }]
        ],
        openId4VcConfiguration: {
            trustedCertificates: []
        }
    }

    return (
        <ParadymWalletSdk.UnlockProvider configuration={sdkConfiguration}>
            /* ... rest of the app ... */
        </ParadymWalletSdk.UnlockProvider>
    )
}

```

### Custom logger

When you are developing with the SDK, you might want a custom logger to use a tool like Sentry. This can be done by implementing the `ParadymWalletSdkLogger` interface.

#### Example

```typescript
import { LogLevel, ParadymWalletSdkLogger, LogData } from '@paradym/wallet-sdk'
import { loggingApi } from '@your-package/api'

export class ParadymWalletSdkCustomLogger implements ParadymWalletSdkLogger {
  private sendDataToLoggingApi(message: string, data?: LogData) {
    void loggingApi.upload(message, data)
  }

  public fatal(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
  }
  public error(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
  }
  public warn(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
  }
  public info(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
  }
  public debug(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
  }
  public trace(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
  }
}
```

Or you can also include a console logger here by extending the `ParadymWalletSdkConsoleLogger`

```typescript
import { LogLevel, ParadymWalletSdkConsoleLogger, LogData } from '@paradym/wallet-sdk'
import { loggingApi } from '@your-package/api'

export class ParadymWalletSdkCustomAndConsoleLogger extends ParadymWalletSdkConsoleLogger {
  private sendDataToLoggingApi(message: string, data?: LogData) {
    void loggingApi.upload(message, data)
  }

  public fatal(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
    super.fatal(message, data)
  }
  public error(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
    super.error(message, data)
  }
  public warn(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
    super.warn(message, data)
  }
  public info(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
    super.info(message, data)
  }
  public debug(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
    super.debug(message, data)
  }
  public trace(message: string, data?: LogData): void {
    this.sendDataToLoggingApi(message, data)
    super.trace(message, data)
  }
}
```

### `AppProvider`

The `ParadymWalletSdk.AppProvider` is the main provider of the SDK, this allows you to get the SDK from anywhere within your application.

> [!IMPORTANT]
> Make sure to place the `ParadymWalletSdk.AppProvider` inside the `ParadymWalletSdk.UnlockProvider` as it will not work without that.

#### Record IDs

> TODO

#### Example

```typescript
import { ParadymWalletSdk } from '@paradym/wallet-sdk'

export default App() {
    return (
        <ParadymWalletSdk.AppProvider recordIds={[]}>
            /* ... rest of the app ... */
        </ParadymWalletSdk.AppProvider>
}
```

When both these providers are added to your application, you should now be able to continue to the usage guide which will go over onboarding and unlocking and receiving, storing and sharing credentials.

## Usage

The SDK is seperated in five states. The first three are related to the onboarding, `initializing`, `not-configured` and `acquired-wallet-key` and the last two `locked` and `unlocked` are for when the app is ready to interact with credentials. The associated functionality can be used by calling the `useParadym('<STATE_NAME>')` hook. This strongly asserts the state and errors when the state is incorrect. This can especially be useful when the app is on a page where it must be unlocked and you can simply do `useParadym('unlocked')` and do not deal with asserting the state manually.

### Onboarding

#### Initializing

When the SDK is initializing, it is simply setting some things up and this state will automatically transition into `locked` or `not-configured`.

#### Not Configured

The state `not-configured` means that the SDK has not yet been used and it should be setup. The state comes with a `setPin` method which is later used to derive the wallet key.

##### Example

```typescript
import { useParadym } '@paradym/wallet-sdk'
import { useState } from 'react'

export default App() {
    const { setPin } = useParadym('not-configured')
    const [walletPin, setWalletPin] = useState<string>()

    const onSetPin = (pin: string) => {
        setWalletPin(pin)
    }

    const onSubmitPin = async () => {
        if(walletPin.length !== 6) throw Error('Invalid pin length')

        await setPin(walletPin) 
    }

    // ...
}
```

When the pin is correctly set, we move on to the next state.

#### Acquired Wallet Key

The state `acquired-wallet-key` means we have the key to create, and later unlock, the wallet derived from the pin. 
This state comes with an `unlock` function which creates the wallet and instantiates the SDK.

##### Biometrics

> TODO

##### Example

```typescript
import { useParadym } from '@paradym/wallet-sdk'
import { Button } from 'react-native'

export default App() {
    const { unlock } = useParadym('acquired-wallet-key')

    const unlockApp = async () => {
        await unlock({enableBiometrics: false})
    }

    return <Button title='finish onboarding' onPress={unlockApp} />
}
```

When `unlock` resolves correctly, we are finished with the onboarding and we can move on to using the credential functionality of the wallet.

### Wallet functionality

> TODO

#### Locked

To start simple, we will first look at the `locked` state. This simply means we need to do some cryptographic operation to unlock the wallet that requires pin.

##### Biometrics

> TODO

##### Example

```typescript
import { useParadym } from '@paradym/wallet-sdk'
import { useState } from '@paradym/wallet-sdk'

export default App() {
    const { unlockUsingPin } = useParadym('locked')
    const [walletPin, setWalletPin] = useState<string>()

    const onSetPin = (pin: string) => {
        setWalletPin(pin)
    }

    const onSubmitPin = async () => {
        if(walletPin.length !== 6) throw Error('Invalid pin length')

        await unlockUsingPin(walletPin) 
    }

    // ...
}
```

Once the pin is correct, the wallet is unlocked and the state will switch to `unlocked`.

### Unlocked

This is the state where most of the functionality lives. Here the wallet is unlocked and fully accessible. Ready to receive some credentials.

#### Example

```typescript
import { useParadym } from '@paradym/wallet-sdk'

export default App() {
    const { paradym } = useParadym('unlocked')

    // ...
}
```

## DidComm

> TODO

## Openid4vc

### Receiving a credential

#### Authentication

> TODO

#### Deeplink

> TODO

#### Scanning a QR code

When working with openid4vci, a QR code is commonly used. For this you need to add a camera package, like [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/), and make sure it allows you to scan a QR code. A QR code for a credential can be retrieved from any issuers webpage, but for this example we use the [Animo Playground](https://funke.animo.id). [This page](https://funke.animo.id/?authorization=none&credentialType=0&dpop=false&format=mso_mdoc&issuerId=188e2459-6da8-4431-9062-2fcdac274f41&keyAttestation=false&tab=issue&walletAttestation=false) gives an mDl issued over openid4vci without any authentication. Near the bottom of the page, you can press `Issue Credential` and a QR code will appear. When it is shown scan it using the app and call something like the example below.

```typescript
import { useParadym } from '@paradym/wallet-sdk'
import { Camera } from '@custom-components'
import { useState } from 'react' 

export default App() {
    const [resolvedCredentialOffer, setResolvedCredentialOffer] = useState<Awaited<ReturnType<typeof paradym.openid4vc.resolveCredentialOffer>>>()

    const onScanned = (uri: string) => {
        const receivedCredentialOffer = await paradym.openid4vc.resolveCredentialOffer({offerUri: uri})
        setResolvedCredentialOffer
    }

    if(resolvedCredentialOffer) {
        return <ResolvedCredentialOfferScreen resolvedCredentialOffer={resolvedCredentialOffer.resolvedCredentialOffer} />
    }

    return (
        <Camera onScanned={onScanned} />
    )
}

const ResolvedCredentialOfferScreen: React.FC<{
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
}> = (props) => {
  const {paradym} = useParadym('unlocked')

  const [credentialForDisplay ,setCredentialForDisplay] = useState<Awaited<ReturnType<typeof paradym.openid4vc.acquireCredentials>>>()

  const onAcquireCredentials = async () => {
    const cfd = await paradym.openid4vc.acquireCredentials({resolvedCredentialOffer: props.resolvedCredentialOffer})
    setCredentialForDisplay(cfd)
  }

  if(credentialForDisplay) {
    return <CompleteCredentialScreen record={credentialForDisplay.credentials[0].record} resolvedCredentialOffer={props.resolvedCredentialOffer} />
  }

  return <View><Button title='Acquire credentials' onPress={onAcquireCredentials} /></View>
}

const CompleteCredentialScreen: React.FC<
  {resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer,
  record: unknown}
> = (props) => {
  const router = useRouter()
  const {paradym} = useParadym('unlocked')

  const onCompleteCredentialRetrieval = async () => {
    await paradym.openid4vc.completeCredentialRetrieval({resolvedCredentialOffer: props.resolvedCredentialOffer,record: props.record as any})
    router.back()
  }

  return <View><Button title='complete credential flow' onPress={onCompleteCredentialRetrieval} /></View>
}
```

### Sharing a credential

After you have filled up your wallet with credentials, verifiers might request them. Requesting a credential, or proof, is quite similiar to the credential flow, where you scan a QR code, resolve some metadata and in the end you share a proof which includes the requested information by the verifier.

#### Deeplink

> TODO

#### DC API

> TODO

#### Scanning a QR code

Scanning a QR code, which contains a credential request, is a common way to start the flow. Again, for this example, we will use the [Animo Playground](https://funke.animo.id/). Specifically, we will use [this request](https://funke.animo.id/?presentationDefinitionId=826fc673-6c8b-4189-a5ec-0ed408f4e6a2__1&queryLanguage=dcql&requestScheme=openid4vp%3A%2F%2F&requestSignerType=x5c&requestVersion=v1.draft24&responseMode=direct_post.jwt&tab=verify&transactionAuthorizationType=none) as it is compatible with the previously issued credential.

##### Example

```typescript
import { useParadym } from '@paradym/wallet-sdk'
import { Camera } from '@custom-components'
import { useState } from 'react' 

export default App() {
  const [resolvedCrdedentialRequest, setResolvedCredentialRequest] = useState<Awaited<ReturnType<typeof paradym.openid4vc.resolveCredentialRequest>>>()

    const onResolveCredentialRequest = async () => {
        const rco = await paradym.openid4vc.resolveCredentialRequest({uri})
        setResolvedCredentialRequest(rco)
    }

    if(resolvedCrdedentialRequest) {
        return <ResolvedCredentialRequestScreen  credentialRequest={resolvedCrdedentialRequest} />
    }

    return (
        <Camera onScanned={onScanned} />
    )
}

const ResolvedCredentialRequestScreen: React.FC<{
  credentialRequest: Awaited<ReturnType<InstanceType<typeof ParadymWalletSdk>['openid4vc']['resolveCredentialRequest']>>
}> = (props) => {
  const { paradym } = useParadym('unlocked')

  const [credentialForDisplay ,setCredentialForDisplay] = useState<Awaited<ReturnType<typeof paradym.openid4vc.acquireCredentials>>>()
  const [finished, setFinished] = useState<Record<string,unknown>>()

  const onShareCredentials = async () => {
    const response = await paradym.openid4vc.shareCredentials({resolvedRequest: props.credentialRequest, selectedCredentials: {}})
    setR(response)
  }

  if(finished) {
    return <CompleteProofScreen />
  }


  return <View style={styles.center}><Button title='Share credentials' onPress={onShareCredentials} /></View>
}

const CompleteProofScreen: React.FC = (props) => {
  const router = useRouter()
  const {paradym} = useParadym('unlocked')

  const onCompleteProof = async () => {
    router.back()
  }

  return <View><Button title='complete proof flow' onPress={onCompleteProof} /></View>
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    alignContent: 'center'
  }
})

```

## Contributing

Is there something you'd like to fix or add? Great, we love community
contributions! To get involved, please follow our [contribution guidelines](./CONTRIBUTING.md).

## License

This project is licensed under the Apache License Version 2.0 (Apache-2.0).
