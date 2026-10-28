---
'@paradym/wallet-sdk': patch
---

Declare `query-string` as a dependency. The invitation parser imported it without listing it, so it only resolved when another package installed it.
