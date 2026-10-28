---
'@paradym/wallet-sdk': patch
---

Update `@animo-id/expo-digital-credentials-api` to 0.6.0, which runs the Android request UI in a process of its own. The shared MMKV store now opens in multi-process mode on Android as well, so the app and the request UI can write the same settings at the same time.
