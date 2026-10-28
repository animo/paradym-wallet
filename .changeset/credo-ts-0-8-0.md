---
'@paradym/wallet-sdk': patch
---

Update `@credo-ts/*` to 0.8.0-alpha-20261027143516, `@openid4vc/*` to 0.8.2, `@owf/mdoc` to 0.9.1 and `@owf/cose` to 0.6.0.

- DIDComm issue credential v1 and present proof v1, the legacy indy credential formats and legacy connection invitations (`c_i`) are no longer supported, as Credo 0.8 removed them. Pending v1 offers and requests are left out of the inbox.
- ISO mdoc requests are answered by their use cases (ISO/IEC 18013-5 second edition, ISO/IEC TS 23220-4), over proximity and the digital credentials API on Android and iOS. A use case can be answered with several documents, and a requested element with one of its alternative sets. The review shows the documents and elements that are sent.
