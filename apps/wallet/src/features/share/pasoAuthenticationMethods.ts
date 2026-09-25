import type { PasoAuthenticationMethod } from '@paradym/wallet-sdk'

/**
 * The `urn:paso:risk:global:amr:1` value, per [PaSO Risk Signal Registry] Section 2.8.
 *
 * The registry asks for "the authentication methods by which the user released the transaction", and
 * under [PSD2] Article 4(30) this array is the evidence that two independent factor categories were
 * involved. An Authorizing Party checks its own policy against it, so every value here has to be
 * something this wallet can actually stand behind today — not what it intends to support.
 *
 * What is true right now:
 *
 * - **`swk`**, not `hwk`. `getCredentialBindingResolver` creates a credential's key with
 *   `backend: 'secureEnvironment'` only when the credential is one of the configured PID schemes, and
 *   `'askar'` — a software key store — for everything else. A payment card is not a PID, so its
 *   signing key is software-secured. [RFC8176] has a value for exactly that and it is not `hwk`.
 * - **`pin`** when the user entered their PIN to release this transaction. That is a knowledge factor
 *   tied to this authorization, which is what SCA asks for.
 *
 * What is deliberately absent:
 *
 * - **`hwk`** until a payment credential's key is actually created in the secure environment. The
 *   decision lives in `getCredentialBindingResolver`; whoever widens it should come back here.
 * - **`bio_strong`/`bio_weak`** and the modality. The biometric unlock this wallet has protects the
 *   *wallet key* that opens the store at app launch — it does not release this credential's key for
 *   this transaction. Reporting a session unlock as though it authorized the payment is precisely
 *   the over-claim that makes an `amr` array worthless as evidence.
 *
 * The consequence is worth being explicit about: where the user released a transaction without
 * entering a PIN, this reports a single factor, and an Authorizing Party enforcing [PSD2] will say so
 * rather than be told two factors it cannot verify. That is the honest failure.
 */
export function resolvePasoAuthenticationMethods(options: {
  /** Whether the user entered their PIN for this transaction specifically. */
  usedTransactionPin: boolean
}): PasoAuthenticationMethod[] {
  const methods: PasoAuthenticationMethod[] = ['swk']

  if (options.usedTransactionPin) methods.push('pin')

  return methods
}
