---
'@paradym/wallet-sdk': patch
---

Check OpenID4VP requests of parties trusted through the lists of access certificate providers against their registration certificate (ETSI TS 119 475), verified through the lists of registration certificate providers set as `registrationCertificateTrustedLists` on the `x509` trust mechanism. The result is set as `overAsking` on the `verifier` of a resolved request. A request without a valid registration certificate is treated as asking for more than it registered.
