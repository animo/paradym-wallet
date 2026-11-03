---
'@paradym/wallet-sdk': patch
---

Payments over the Digital Credentials API on Android, for PaSO (`urn:paso:sca:global:payment:1`) and TS 12 (`urn:eudi:sca:eu.europa.ec:payment:single:1`).

- PaSO Credentials are now registered, and payment cards only match requests that carry their payment type. The credential picker shows the payee and the amount.
- `DcApiReview.transactionData` is the payment to show before sharing, and `share` takes the authentication methods for the PaSO risk signals. Other transaction types are refused.
- The card picked in the credential picker is the card that is presented.

Updates `@animo-id/expo-digital-credentials-api` to 0.7.0, whose matcher shows payments and matches the vcts a credential type extends.
