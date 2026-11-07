---
'@paradym/wallet-sdk': patch
---

Check OpenID4VCI offers of issuers trusted through the lists of access certificate providers against the registration certificates in the `issuer_info` of their signed metadata (ETSI TS 119 472-3), verified through `registrationCertificateTrustedLists`. Each offered credential has to be in the `provides_attestations` of a registration certificate whose `credential_ids` include it, or that has no `credential_ids`, and the result is set as `issuerRegistration` on the resolved offer. An issuer without a registration certificate isn't checked, as it is optional.
