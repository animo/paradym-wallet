import type { ClaimPath } from '../format/attributes'

/**
 * What the credential the claim belongs to is, as far as the caller knows it.
 *
 * `unknown` is not a gap to be filled in later — it is the honest answer wherever a label is
 * resolved without a credential to read: a DIDComm offer before it is accepted, a requested
 * attribute no credential in the wallet satisfies, an activity whose credential has been deleted.
 * The alternative, optional fields on every variant, would let a resolver branch on a `docType`
 * that is only missing because nobody knew it.
 */
export type AttributeLabelCredentialContext =
  | { format: 'mso_mdoc'; docType: string }
  | { format: 'dc+sd-jwt'; vct: string }
  | { format: 'w3c'; types: string[] }
  | { format: 'anoncreds'; schemaId: string; credentialDefinitionId: string }
  | { format: 'unknown' }

export type AttributeLabelContext = AttributeLabelCredentialContext & {
  /** The claim's own name — the last string segment of {@link path}. */
  key: string

  /**
   * Where the claim sits in the credential. For an mdoc it starts with the namespace.
   *
   * Only claims with a name are resolved, so the last segment is always a string. Array elements
   * are labelled by the array they are in.
   */
  path: ClaimPath
}

/**
 * How the wallet names a claim the credential itself did not name.
 *
 * Resolving an issuer-supplied label is reading the credential, which is the SDK's job. Deciding
 * that `birth_date` reads as "Date of birth", in the user's language, is the wallet's — it is a
 * convention about well-known claim names, not something the credential says. So the app supplies
 * it, and the SDK falls back to formatting the key itself when nothing does.
 *
 * Set once at setup rather than passed per call: the labels are resolved deep inside the attribute
 * tree, and several paths need them where no wallet instance is in scope. Held here for the same
 * reason as the locale, and with the same consequence — one per process.
 *
 * Beware that a credential's display is cached per record and locale. A resolver whose answers
 * depend on the locale is fine; one that changes for any other reason will not invalidate that
 * cache. Everything in {@link AttributeLabelContext} is derived from the credential itself, so
 * branching on it is safe.
 */
export type ResolveAttributeLabel = (context: AttributeLabelContext) => string | undefined

let resolveAttributeLabel: ResolveAttributeLabel | undefined

export function getAttributeLabel(context: AttributeLabelContext): string | undefined {
  return resolveAttributeLabel?.(context)
}

export function setResolveAttributeLabel(resolve: ResolveAttributeLabel | undefined): void {
  resolveAttributeLabel = resolve
}
