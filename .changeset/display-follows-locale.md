---
'@paradym/wallet-sdk': patch
---

Credential and issuer display (name, description, colours, background image, logo) now follows the wallet's locale, like attribute labels already did. Before, the English entry was always used. The fallback stays the same: English, then an entry without a locale, then the first.
