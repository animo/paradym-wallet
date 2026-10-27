---
'@paradym/wallet-sdk': patch
---

Add the `legacyIds` option, for wallets that change their store id. On unlock, when no store exists under `id` yet, the store under the first legacy id that has one is moved to `id`. A reset removes the stores under the legacy ids as well. `moveLegacyStore` does the same for other stores the wallet keeps.
