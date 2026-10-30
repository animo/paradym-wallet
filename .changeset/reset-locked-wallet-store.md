---
'@paradym/wallet-sdk': patch
---

Resetting a locked wallet, or one whose wallet key was acquired but not unlocked, now removes the wallet store too. Before, it only removed the salt. A store left behind from an interrupted onboarding then couldn't be opened with the next PIN, so onboarding failed every time. `reset` takes the wallet configuration as a second argument, to find the store without an unlocked `ParadymWalletSdk`.
