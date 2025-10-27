<div align="center">
   <img src="assets/icon.png" alt="Animo Logo" height="176px" />
</div>

<h1 align="center"><b>Paradym Wallet</b></h1>

🚀 Welcome to the Paradym Mobile Wallet repository!

The Paradym Mobile Wallet is a digital identity wallet developed as a companion to the [Paradym platform](https://paradym.id/). It supports both EUDI and global standards. See the full overview of the current supported standards and protocols [here](https://paradym.id/products/paradym-mobile-wallet).

> The Paradym wallet can be downloaded directly from the app store ([iOS](https://apps.apple.com/nl/app/paradym-wallet/id6449846111?l=en), [Android](https://play.google.com/store/apps/details?id=id.paradym.wallet)), or the code in this repository can be adapted. The wallet is also available as a [whitelabel solution](mailto:ana@paradym.id). 

<div align="center">
  <img src="assets/ios-1.png" width="30%" />
  <img src="assets/ios-2.png" width="30%" />
  <img src="assets/ios-3.png" width="30%" />
</div>

<p align="center"><i>Impression of Paradym Wallet</i></p>

With Paradym Wallet, you can seamlessly manage and present your digital credentials, allowing for a secure and private digital existence. Your data is stored locally on your device, meaning that you retain full control over your information and decide who you want to share it with.

> **Note:** 
> This repository contains both the main (stable) Paradym wallet, and a more experimental EUDI Prototype app. To read more about the Animo EUDI wallet prototype, look in the [EasyPID app directory](apps/easypid).

## Try it out

You can download Paradym Wallet from the [Google Play Store](https://play.google.com/store/apps/details?id=id.paradym.wallet) or [Apple App Store](https://apps.apple.com/nl/app/paradym-wallet/id6449846111?l=en).

You can test out the wallets in these environments (as well as any solution that issues and/or verifies credentials according to the supported standards):

- [Paradym Issuer/Verifier platform](https://paradym.id/sign-up). Test out how the Paradym wallet looks and feels using the Paradym free tier. 
- [EUDI Playground](https://funke.animo.id/). Test out several pre-configured flows based on the main EUDI use cases.


## Project Structure

The project is a monorepo managed using **pnpm**, which contains an **Expo React Native** application. The UI is built using **Tamagui**, and navigation is handled using **Expo Router and React Navigation**. For the Agent and SSI capabilities **Credo Framework** is used.

The folder structure is as follows

- `apps` top level applications
  - `easypid` Paradym and Funke Wallet - react native app for iOS & Android
- `packages` shared packages
  - `ui` includes our custom UI kit that will be optimized by Tamagui
  - `agent` includes the Credo agent and SSI capabilities
  - `app` you'll be importing most files from `app/`
    - `features` (don't use a `screens` folder. organize by feature.)
    - `provider` (all the providers that wrap the app, and some no-ops for Web.)
    - `navigation` This folder contains navigation-related code for RN. You may use it for any navigation code, such as custom links.
  - `scanner` includes utils for scanning QR codes.
  - `secure-store` contains methods to securely store, derive and retrieve the wallet key.
  - `translations` includes utils for translations based on the Lingui package.
  - `utils` contains varied utils used across the other packages.

You can add other folders inside of `packages/` if you know what you're doing and have a good reason to.

## 🏁 Start a wallet

First, start by installing all dependencies by running `pnpm install`.

Once all dependencies are installed, you need to make sure you have a development build of the app on your mobile device. You can install this using the following commands:

```sh
cd apps/easypid
pnpm prebuild
pnpm ios # or android
```

You only need to install the development build when **native** dependencies change. If you're only working on JS, you can skip this step if you already have the development build installed.

Once installed you can run `pnpm start` from the root of the project to start your development server.

## 📦 Releasing

Uploading builds to Appstore Connect and the Google Play Console are automated using Github Actions and Expo Build. 

Before making a release, make sure to update the `version` in the `apps/easypid/package.json`. We generally follow semver, and so for fixes we update the patch version, for new features we update the minor version, and for large refactorings we can use the major version. However we often push user-facing changes as minor and not major, as the wallet is not interacted with by a machine, so "breaking change" is hard to define.



To trigger a release of the Paradym Wallet, run the [Continuous Deployment](https://github.com/animo/paradym-wallet/actions/workflows/continuous-deployment.yaml) workflow. Make sure to:
- Set the channel to `production`
- The platform to `all` (unless you only want to release for iOS OR Android)
- App to `paradym` (or to `funke` in case you want to deploy our EUDI Wallet Prototype).

This will trigger builds in Expo, and will then automatically upload the builds to Appstore Connect and Google Play. Build numbers are automatically incremented by Expo.

Releases are automatically published as internal release on Testflight and Google Play, allowing them to be tested.

From there on you can manually create a release in the respective platforms (of which plentry documentation can be found online).

## 🆕 Add new dependencies

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
cd apps/easypid
pnpm add react-native-reanimated
cd ..
pnpm
```

You can also install the native library inside of `packages/app` if you want to get autoimport for that package inside of the `app` folder. However, you need to be careful and install the _exact_ same version in both packages. If the versions mismatch at all, you'll potentially get terrible bugs. This is a classic monorepo issue. You can use `lerna-update-wizard` to help with this (you don't need to use Lerna to use that lib).
