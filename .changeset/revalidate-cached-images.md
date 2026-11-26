---
'@paradym/wallet-sdk': patch
---

The wallet keeps its own copies of the images its credentials, deferred credentials and activities use, such as the logos of issuers and verifiers. A copy is scaled down when stored, doesn't expire, and is shared with the credential request UI on iOS. It is removed with the last record that uses it. `useRevalidateImages` and `revalidateImage` replace a copy when the image behind the url changed. `ParadymWalletSdk.AppProvider` stores the images of records from before. A wallet reset removes the copies, along with the images expo-image cached.
