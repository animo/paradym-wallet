---
'@paradym/wallet-sdk': patch
---

Cached images can be revalidated, so a logo an issuer or verifier replaced at the same url is picked up. `useRevalidateImages` and `revalidateImage` download a cached image again and cache a changed one under a new key. The icons registered for the Digital Credentials API follow that key. A wallet reset clears the image cache.
