---
'@paradym/wallet-sdk': patch
---

A party that chains up to a trusted x509 entity, or signs with a trusted DID, is now shown with the entity's own name and logo. Before, the request's client metadata or the offer's issuer metadata came first. The new required `display` of `TrustedX509Entity` and `TrustedDidEntity` decides this: `'entity'` for the entity's name and logo, or `'external'` for what the party provides itself. That's its metadata, as before, or else the name in its certificate, which is also used for mdoc reader authentication. The x509 entity is then listed as the party's trusted entity, rather than as the party itself. A `TrustedX509Entity` also takes `children`: parties under it, recognized by an intermediate or leaf certificate in the chain they present, and shown with their own name and logo. The chain is still validated up to the entity, which is the child's trusted entity. A child's `entityId` is `x509:<entity>:<child>` in every request and offer.
