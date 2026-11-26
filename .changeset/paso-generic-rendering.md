---
'@paradym/wallet-sdk': patch
---

PaSO transactions of every type can be shown and authorized, and the Wero Payment Attestation Rulebook v1.1 is supported.

- The payment payload is accepted in the Wero form as well, with `amount` as a number and a separate `currency`. The issuer's metadata has to describe the same form.
- `payment_account_label` is read from the `ui_labels`, as `paymentAccountLabel`.
- Mandates, Generic transactions and types without a rulebook resolve to a `FormattedTransactionDataPasoClaims` (`type: 'paso_claims'`), with typed values in claim order and `template:` labels and values interpolated. `isPasoTransaction` tells both PaSO kinds apart from TS 12.
- Claims without a display array are returned as `details`.
- Ad-hoc metadata from a Relying Party in the card's `adhoc_metadata_clients` is used for that transaction.
- `ParadymWalletPasoError` carries a `detail` saying why a transaction can't be shown, and `noMatchingCard` when no card can authorize it.
- `getAttributesWithDisplay` returns the attributes the claim metadata labels.
- `acquireCredentials` with a transaction code takes `onAccessToken`, called once the code is accepted.
- `fetchAndProcessDeferredCredentials` returns the names of the cards that were issued, and `useRefreshedDeferredCredentials` takes an `onIssued` callback. `useHasInboxNotifications` counts deferred cards.
- `secureWalletKey.getWalletKeyUsingBiometrics` takes an optional prompt, for when the biometric confirms a request rather than unlocks the wallet.
