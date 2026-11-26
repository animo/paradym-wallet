---
'@paradym/wallet-sdk': patch
---

Require `query-string` ^9.5.1, which depends on `decode-uri-component` ^0.5.0 instead of the vulnerable 0.4.x (denial of service through quadratic decoding of percent-encoded runs).
