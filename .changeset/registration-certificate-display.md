---
'@paradym/wallet-sdk': patch
---

A resolved request or offer of a party trusted through `accessCertificateTrustedLists` has a `registration` with the purpose, website, privacy policy and support link from its verified registration certificate (ETSI TS 119 475). The support contact in the access certificate is the fallback for the support link. Links that aren't `https` are left out, and a support email address becomes a `mailto` link. A registered purpose replaces the purpose of the request in `formattedSubmission`. When the party acts through an intermediary, its name now comes from the registration certificate.
