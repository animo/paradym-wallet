---
'@paradym/wallet-sdk': patch
---

A share answered through the DC API request UI is now written to the activity log before the response is sent. Sending the response closes the request UI, and on Android its process ends with it, so an entry written afterwards could be lost.
