---
'@paradym/wallet-sdk': patch
---

The user can pick which of their matching credentials to share, over OpenID4VP, the Digital Credentials API and proximity.

- Every entry of a `FormattedSubmission` lists the credentials that answer it, for mdoc requests too. The first one is shared. `selectSubmissionCredentials` moves the picked ones to the front, and replaces `selectPasoPaymentCredential`.
- `DcApiReview.select` returns the review with another credential for an entry, with its transaction resolved again.
- On Android, the mdoc picked in the credential picker is the one shared.
- An SD-JWT VC that matches a query more than once is listed once.
