<div align="center">
   <img src="assets/icon-rounded.png" alt="EasyPID Logo" height="176px" />
</div>

<h1 align="center"><b>Animo EasyPID</b></h1>

This app was created by [Animo Solutions](https://animo.id/) in the context of the [SPRIN-D Funke ‘EUDI Wallet Prototypes’](https://www.sprind.org/en/challenges/eudi-wallet-prototypes/). It serves as a prototype for future wallet providers and can be tested/used with our [playground environment](https://funke.animo.id/). For more information on the project reach out to <ana@animo.id>. 

During the project an identity wallet and a test relying party was delivered.


## Features
The identity wallet contains the following features, you can see the full flow without running the app in the [Figma design](https://www.figma.com/proto/gBBLERk7lkE27bw8Vm3es4/Funke?show-proto-sidebar=1):


**General App**
- 🟢 Onboard user
  - 🟢 Set up PIN
  - 🟢 Set up biometrics
  - 🟠 Accept privacy policy
  - 🟢 Onboarding instruction
  - 🔴 Skippable identity instruction
- 🟠 Home screen
- 🟠 Activity
- 🟠 About the app
- 🔴 Credential overview
- 🔴 German language option

**Credential Management**
- 🟢 Credential detail
- 🟢 Delete QEAA
- 🟠 SD-JWT VC Type Metadata
   - Resolved and base is used, but not claim metadata or SVG template yet
- 🟠 Revocation SD-JWT VC
- 🔴 Revocation Mdoc
- 🔴 Re-receive the PID

**Obtain PID from PID provider**
- 🟢 SD JWT VC using OpenID4VCI 
- 🟢 Mdoc using OpenID4VCI 
- 🟢 [C option](https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md#preliminary-assessment-and-comparison-of-pid-design-options)
- 🟢 [C' option](https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md#preliminary-assessment-and-comparison-of-pid-design-options)
- 🟢 [B' option](https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md#preliminary-assessment-and-comparison-of-pid-design-options) *temporarily disabled*
- 🟢 Receive the PID from inside of the wallet


**Obtain (Q)EAAs from issuer**
- 🟢 SD-JWT VC using OpenID4VCI
- 🟢 mDOC using OpenID4VCI
- 🟢 PID presentation during (Q)EAA issuance
- 🟠 Batch issuance and single use credentials
- 🟢 Authorization code flow
- 🔴 Client attestations

**Present attestations remotely** 
- 🟢 PID SD-JWT VC using OpenID4VP
- 🟢 PID mDOC using OpenID4VP
- 🟢 QEAA SD JWT VC using OpenID4VP
- 🟢 QEAA Mdoc using OpenID4VP
- 🟢 Combined presentations
- 🟢 Cross-device QR flow
- 🟢 Same-device flow
- 🟢 SD-JWT OID4VC conformance test suite
- 🟢 mDOC OID4VC conformance test suite 
- 🟠 New VP query language

**Present attestations in-person**
- Android
  - 🟢 Android-Android over NFC for device engagement
  - 🔴 SD-JWT VC using OpenID4VP over BLE
  - 🟠 mDOC over BLE
- iOS
  - 🔴 SD-JWT VC using OpenID4VP over BLE
  - 🔴 mDOC over BLE

**HSM**
  - 🟢 On device HSM
  - 🟠 Cloud-backed HSM

**Trust Establishment using OpenID Federation Draft 40**
- 🟢 Issuer and verifier entity configuration
- 🟠 Verifier e2e flow with the right keys
- 🟠 Functions for showing everything in the wallet
- 🔴 Issuer e2e flow 
- 🔴 Wallet in the OpenID Federation

**Other**
- 🔴 HAIP compliance
- 🟠 WCAG 2.1 compliance
- 🔴 AI-based oversharing detection

**[Test issuer/verifier](https://funke.animo.id/)** 

- 🟢 Issue QEAAs
- 🟢 Verify PID
- 🔴 Verify mixed PID-QEAA requests

The identity wallet contains the following temporary features for development and testing:

- Using a simulated eID test card
- Reset wallet

 <div align="center">
  <img src="assets/screen1.png" width="30%" />
  <img src="assets/screen2.png" width="30%" /> 
  <img src="assets/screen3.png" width="30%" />
</div>

 <p align="center"><i>Impression of the EasyPID Wallet</i></p> 

## Install

The prototype app is currently published privately to select parties. If you're a tester for the SPRIN-D Funke project, you should have received the details on installing the app (either directly or via the guidebook). If not, please reach out to us at ana@animo.id.

## Try it out

Here's some resources and tips that might be helpful while testing the app.

### Before you start

- Make sure you are have access to the BDR PID issuer which is behind a firewall
- Have an eID card ready
- Have the [test relying party](https://funke.animo.id/) ready
    - The test relying party enables you to select a credential type and request type to verify the PID credential. 
    - It will display a QR code as well as relevant information, 

### Device Compatibility

#### Android

This app requires devices with:

- Android 8+
- Hardware Security Module (HSM)
- Biometric support (e.g., fingerprint sensor, face recognition)

Android devices without these features will not be able to run the app.

#### iOS

Compatible with iPhone 5s and later models. This app requires devices with:
- iOS 14+

### While testing

- The very first screen has an option to switch between the C and B' flow for testing purposes. It is located on the left side besides the continue button.
- There is an option to reset the wallet during testing. It is located in the menu, which you can find on the home page.

## Project Structure

The EasyPID wallet is part of a larger monorepo. The EasyPID app is located in the [apps/easypid](apps/easypid) directory.

### EasyPID App

This is the actual EasyPID application. It is built using Expo and React Native.

The app uses file-based routing starting in the [`src/app`](src/app) directory. Each file in this directory is a route within the app. 

E.g. ['src/app/authenticate.tsx'](src/app/authenticate.tsx) is the entry point for the authentication screen.

Initially when the app is opened, the [`src/app/(app)/_layout.tsx`](src/app/(app)/_layout.tsx) is rendered. This is the main layout for the app. If the wallet is not unlocked, the user is redirected to the onboarding (on first launch) or authentication screen (on return).

### Agent

The agent contains the digital identity related wallet functionality. It uses an [Credo](https://github.com/openwallet-foundation/credo-ts) agent instance to manage the wallet.

[Aries Askar](https://github.com/hyperledger/aries-askar) is used for cryptographic operations and encrypted storage of the wallet data. 

[Expo Secure Environment](https://github.com/animo/expo-secure-environment) is used to provide support for cryptographic operations using the device's secure environment (HSM, SE, etc.) hidden behind biometric authentication.

Some relevant links:
- [Handling invitations](../../packages/agent/src/invitation/handler.ts) - this is the entry point for most interactions in the app that need to use the agent. E.g receiving and sharing credentials

### Secure Unlock

The secure store package located in [`packages/secure-store`](packages/secure-store) contains logic for secure unlocking and initializing of the wallet. It uses [React Native Keychain](https://github.com/oblador/react-native-keychain) under the hood, which integrates with the device's secure APIs for storing sensitive data.

It also contains the logic for deriving the wallet's master key from the user PIN (using KDF). Whenver the wallet is opened, the PIN is required to unlock the wallet.

Alternatively, the derive PIN can be stored in the device's keychcain, allowing the user to retrieve the master key from the keychain and unlock the wallet directly.

Relevant links:
- [Secure Unlock Provider](../../packages/secure-store/secure-wallet-key/SecureUnlockProvider.tsx) - the main entry point for secure unlocking and initialization of the wallet

### App / UI Package

The [app pacakge](packages/app) and [ui pacakge](packages/ui) contain the underlying app UI and screens logic. This code is shared between our existing [Paradym Wallet](apps/paradym) also located in this repository. This allows us to reuse base elements, while still providing custom screens and UI elements in each of the applications.

### PID Options

The C flow supported in the Pardaym Wallet is mostly implemetned in Credo, the underlying identity framework we use. 

## Tech stack / base components

The following section lists the software components used to create the EasyPID wallet. The heavy lifting is done by [Credo](https://github.com/openwallet-foundation/credo-ts). The most notable dependencies consumed by Credo are the [OpenId4Vc](https://github.com/Sphereon-Opensource/OID4VC) [Mdoc](https://github.com/Sphereon-Opensource/mdoc-cbor-crypto-multiplatform) and [SdJwt](https://github.com/openwallet-foundation-labs/sd-jwt-js) libraries. Other notable dependencies include the Animo [Expo Secure Environment](https://github.com/animo/expo-secure-environment), which provides support for cryptographic operations using the device's secure environment (HSM, SE, etc.) hidden behind biometric authentication, and Animo [Ausweis Sdk](https://github.com/animo/expo-ausweis-sdk) for automatic setup and configuration of the Ausweis SDK for iOS and Android in Expo apps.

- [Credo](https://github.com/openwallet-foundation/credo-ts)
  - [OpenId4Vc](https://github.com/Sphereon-Opensource/OID4VC)
  - [Mdoc](https://github.com/Sphereon-Opensource/mdoc-cbor-crypto-multiplatform)
  - [SdJwt](https://github.com/openwallet-foundation-labs/sd-jwt-js)
- [Expo Secure Environment](https://github.com/animo/expo-secure-environment)
- [Ausweis Sdk](https://github.com/animo/expo-ausweis-sdk)

The following standards and specifications were implemented.

- 🟢 [OpenID for Verifiable Credential Issuance - ID 1 / Draft 13](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0-ID1.html)
- 🟢[OpenID for Verifiable Presentations - Draft 20](https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html)
- 🟢 [SD-JWT VC - Draft 3](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-03.html)
- 🟢 [Self-Issued OpenID Provider V2 - Draft 13](https://openid.net/specs/openid-connect-self-issued-v2-1_0-13.html)
- 🟢 [ISO 18013-5](https://www.iso.org/standard/69084.html)
- 🟡 [ISO/IEC TS 18013-7 DTS Ballot Text](https://www.iso.org/standard/82772.html)
  - Missing JWT Secured Authorization Response Mode
- 🟡 [High Assurance Interop Profile - Draft 0](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-sd-jwt-vc-1_0-00.html)
  - Missing verifier_attestation, `haip://` scheme and wallet attestation
- 🟠 [OpenID Federation - Draft 34](https://openid.net/specs/openid-federation-1_0-34.html)

## Changelog

### 02-09-2024

- Redeployed test relying party to add a "Open in Wallet" button for same device flow ([commit](https://github.com/animo/openid4vc-playground-funke/commit/9a839521e8d70aaf92b7fa03fa037fc866644ad0))
