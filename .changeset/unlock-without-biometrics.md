---
'@paradym/wallet-sdk': patch
---

`unlock({ enableBiometrics: false })` now turns biometric unlock off. Before, biometrics counted as enabled until something set them, so the next unlock stored the wallet key for biometrics and the unlock after that asked for a biometric.
