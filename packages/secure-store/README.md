<div align="center">
   <img src="../../assets/icon.png" alt="Paradym Logo" height="176px" />
</div>

<h1 align="center"><b>Secure Store</b></h1>

This package contains methods to securely store, derive and retrieve the wallet key. It contains functionality using both React Native Keychain and Expo Secure Store. For this reason, there's no generic package export, but you should import from the specific files to only import the needed dependencies.

## Using React Native Keychain

Using `react-native-keychain` is the recommended approach and provides the best security. If you want to use this in an app, you need to make sure `react-native-keychain` and `react-native-argon2` are installed in the app.

You should import from `@package/secure-store/secureUnlock`.

## Using Expo Secure Store

Expo Secure Store was used previously to store the wallet key, however no PIN or integration with device biometrics has been implemented. This is kept as legacy behavior until the Paradym Wallet can be updated to use the new (more secure) approach. You need to make sure `expo-secure-store` is installed in the app.

You should import from `@package/secure-store/legacyUnlock`