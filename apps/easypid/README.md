<div align="center">
   <img src="assets/easypid.png" alt="EasyPID Logo" height="176px" />
</div>

<h1 align="center"><b>Animo EasyPID</b></h1>

This app is an implementation of a mobile EUDI wallet protoype.

This app was created by [Animo Solutions](https://animo.id/) in the context of the [SPRIN-D Funke ‘EUDI Wallet Prototypes’](https://www.sprind.org/en/challenges/eudi-wallet-prototypes/). It serves as a prototype for future wallet providers. For more information on the project reach out to <ana@animo.id>.

In the project an identity wallet and a test relying party was delivered.

The identity wallet contains the following features:

- Onboard user
- Set up PIN
- Set up biometrics
- Authentication using biometrics or PIN
- Obtain PID from PID provider ([C option](https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md))
- Obtain PID from PID provider ([B' option](https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md))
- Present attestations remotely using cross-device QR flow
- Present attestations remotely using same-device flow
- About the app

The identity wallet contains the following temporary features for development and testing:

- Switch between C and B' PID flow
- Reset wallet

<!--
TODO if possible: add pictures / video
 <div align="center">
  <img src="assets/ios-1.jpg" width="30%" />
  <img src="assets/ios-2.jpg" width="30%" /> 
  <img src="assets/ios-3.jpg" width="30%" />
</div> -->
<!-- 
<p align="center"><i>Impression of Paradym Wallet</i></p> -->

## Install

## Try it out

Here's some resources and tips that might be helpful while testing the app.

### Before you start

- Make sure you are connected to the VPN <!--TODO: LINK -->
- Have an eID card ready
- Have the [test relying party](https://funke.animo.id/) ready
    <!-- - The test relying party enables you to select a TODO ADD -->

### During

- The very first screen has an option to switch between the C and B' flow for testing purposes. It is located on the left side besides the continue button.
- There is an option to reset the wallet during testing. It is located in the menu that you can find on the home page.

## Device Compatibility

### Android

This app requires devices with:

- Hardware Security Module (HSM)
- Biometric support (e.g., fingerprint sensor, face recognition)

Android devices without these features will not be able to run the app.

### iOS

Compatible with iPhone 5s and later models.

## Project Structure

<!-- The project is a monorepo managed using **pnpm**, which contains an **Expo React Native** application. The UI is built using **Tamagui**, and navigation is handled using **Expo Router, React Navigation and Solito**. For the Agent and SSI capabilities **Aries Framework JavaScript (AFJ)** is used.

The folder structure is as follows

- `apps` top level applications
  - `paradym` Paradym Wallet - react native app for iOS & Android
  - `easypid` EasyPID Wallet - react native app for iOS & Android
- `packages` shared packages
  - `ui` includes our custom UI kit that will be optimized by Tamagui
  - `agent` includes the Aries Framework JavaScript (AFJ) agent and SSI capabilities
  - `app` you'll be importing most files from `app/`
    - `features` (don't use a `screens` folder. organize by feature.)
    - `provider` (all the providers that wrap the app, and some no-ops for Web.)
    - `navigation` This folder contains navigation-related code for RN. You may use it for any navigation code, such as custom links.

You can add other folders inside of `packages/` if you know what you're doing and have a good reason to. -->

## Tech stack / base components

The following section lists the software components used to create the EasyPID wallet. The heavy lifting is done by [Credo](https://github.com/openwallet-foundation/credo-ts). The most notable dependencies consumed by Credo are the [OpenId4Vc](https://github.com/Sphereon-Opensource/OID4VC) [Mdoc](https://github.com/Sphereon-Opensource/mdoc-cbor-crypto-multiplatform) and [SdJwt](https://github.com/openwallet-foundation-labs/sd-jwt-js) libraries. Other notable dependencies include the Animo [Expo Secure Environment](https://github.com/animo/expo-secure-environment), which provides support for cryptographic operations using the device's secure environment (HSM, SE, etc.) hidden behind biometric authentication, and Animo [Ausweis Sdk](https://github.com/animo/expo-ausweis-sdk) for automatic setup and configuration of the Ausweis SDK for iOS and Android in Expo apps.

- [Credo](https://github.com/openwallet-foundation/credo-ts)
  - [OpenId4Vc](https://github.com/Sphereon-Opensource/OID4VC)
  - [Mdoc](https://github.com/Sphereon-Opensource/mdoc-cbor-crypto-multiplatform)
  - [SdJwt](https://github.com/openwallet-foundation-labs/sd-jwt-js)
- [Expo Secure Environment](https://github.com/animo/expo-secure-environment)
- [Ausweis Sdk](https://github.com/animo/expo-ausweis-sdk)

The following standards and specifications were implemented.

- [OpenID for Verifiable Credential Issuance - ID 1 / Draft 13](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0-ID1.html)
- [OpenID for Verifiable Presentations - Draft 20](https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html)
- [SD-JWT VC - Draft 3](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-03.html)
- [Self-Issued OpenID Provider V2 - Draft 13](https://openid.net/specs/openid-connect-self-issued-v2-1_0-13.html)
- [ISO 18013-5](https://www.iso.org/standard/69084.html)
- [ISO/IEC TS 18013-7 DTS Ballot Text](https://www.iso.org/standard/82772.html)
- [High Assurance Interop Profile - Draft 0](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-sd-jwt-vc-1_0-00.html)
- ❌ [OpenID Federation - Draft 34](https://openid.net/specs/openid-federation-1_0-34.html)

## 🏁 Start a wallet

<!-- First, start by installing all dependencies by running `pnpm install`.

Once all dependencies are installed, you need to make sure you have a development build of the app on your mobile device.
You can install this using the following commands:

```sh
cd apps/easypid
pnpm prebuild
pnpm ios # or android
```

You only need to install the development build when **native** dependencies change. If you're only working on JS, you can skip this step if you already have the development build installed.

Once installed you can run `pnpm start` from the root of the project to start your development server. -->

<!-- ## 🆕 Add new dependencies

### Pure JS dependencies

If you're installing a JavaScript-only dependency that will be used across platforms, install it in `packages/app`:

```sh
cd packages/app
pnpm add date-fns
cd ../..
pnpm
```

### Native dependencies

If you're installing a library with any native code, you must install it in `expo`:

```sh
cd apps/paradym
pnpm add react-native-reanimated
cd ..
pnpm
```

You can also install the native library inside of `packages/app` if you want to get autoimport for that package inside of the `app` folder. However, you need to be careful and install the _exact_ same version in both packages. If the versions mismatch at all, you'll potentially get terrible bugs. This is a classic monorepo issue. You can use `lerna-update-wizard` to help with this (you don't need to use Lerna to use that lib). -->
