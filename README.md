# Paradym Wallet

<p align="center">
  <img src="assets/ios-1.jpg" width="30%" />
  <img src="assets/ios-2.jpg" width="30%" /> 
  <img src="assets/ios-3.jpg" width="30%" />
</p>

This repo contains an implementation of a mobile [Paradym](https://paradym.id) SSI wallet.

With Paradym Wallet, you can seamlessly manage and present your digital credentials, allowing for a secure and private digital existence. Your data is stored locally on your device, meaning that you retain full control over your information and decide who you want to share it with.

You can download Paradym Wallet from the [Google Play Store](https://play.google.com/store/apps/details?id=id.paradym.wallet) or [Apple App Store](https://apps.apple.com/nl/app/paradym-wallet/id6449846111?l=en).

## Try it out

You can download Paradym Wallet from the [Google Play Store](https://play.google.com/store/apps/details?id=id.paradym.wallet) or [Apple App Store](https://apps.apple.com/nl/app/paradym-wallet/id6449846111?l=en).

The wallet can be used in three environments:

- Dutch Blockchain Coalition (DBC): Use your wallet to access the DBC zone where you can find extra resources related to DBC events. You can use [this link](https://ssi.dutchblockchaincoalition.org/demo/issuer) to receive your credential, and log in on the [DBC website](https://www.dutchblockchaincoalition.org/userlogin).
- Triall: Log in to the Triall environment. Obtain your credential [here](https://ssi.triall.io/demo/issuer) and enter the environment on the [Trial website](https://ssi.triall.io/demo/issuer).
- Future Mobility Alliance: Access the Future Mobility Data Marketplace by obtaining your credential [here](https://ssi.future-mobility-alliance.org/demo/issuer) and logging in via the [FMA website](https://marketplace.future-mobility-alliance.org/).

## Structure

The project is a monorepo managed using **Yarn (v3)**, which contains an **Expo React Native** application. The UI is built using **Tamagui**, and navigation is handled using **Expo Router, React Navigation and Solito**. For the Agent and SSI capabilities **Aries Framework JavaScript (AFJ)** is used.

The folder structure is as follows

- `apps` top level applications
  - `expo` react native app for iOS & Android
- `packages` shared packages
  - `ui` includes our custom UI kit that will be optimized by Tamagui
  - `agent` includes the Aries Framework JavaScript (AFJ) agent and SSI capabilities
  - `app` you'll be importing most files from `app/`
    - `features` (don't use a `screens` folder. organize by feature.)
    - `provider` (all the providers that wrap the app, and some no-ops for Web.)
    - `navigation` This folder contains navigation-related code for RN. You may use it for any navigation code, such as custom links.

You can add other folders inside of `packages/` if you know what you're doing and have a good reason to.

## 🏁 Start the app

First, start by installing all dependencies by running `yarn`.

Once all dependencies are installed, you need to make sure you have a development build of the app on your mobile device.
You can install this using the following commands:

```
cd apps/expo
yarn prebuild
yarn ios # or android
```

You only need to install the development build when **native** dependencies change. If you're only working on JS, you can skip this step if you already have the development build installed.

Once installed you can run `yarn native` from the root of the project to start your development server.

## 📦 Releasing

🚧 Soon documentation will be added on how to publish a new release to the Apple App Store and Google Play Stores. 🚧

## 🧪 Integration Testing

We use [Maestro](https://maestro.mobile.dev/) for integration testing. Maestro is a tool for writing integration tests for mobile apps. It allows you to write tests in YAML that run on real devices and interact with your app just like a real user would.

The tests are located in the `.maestro` folder.

You need to have the app running with `yarn ios/android` before running the tests.

### Required dependencies

- [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro)

### Running tests

- `yarn maestro:test` - Run all tests
- `yarn maestro:studio` - A GUI for creating test actions

## 🆕 Add new dependencies

### Pure JS dependencies

If you're installing a JavaScript-only dependency that will be used across platforms, install it in `packages/app`:

```sh
cd packages/app
yarn add date-fns
cd ../..
yarn
```

### Native dependencies

If you're installing a library with any native code, you must install it in `expo`:

```sh
cd apps/expo
yarn add react-native-reanimated
cd ..
yarn
```

You can also install the native library inside of `packages/app` if you want to get autoimport for that package inside of the `app` folder. However, you need to be careful and install the _exact_ same version in both packages. If the versions mismatch at all, you'll potentially get terrible bugs. This is a classic monorepo issue. You can use `lerna-update-wizard` to help with this (you don't need to use Lerna to use that lib).
