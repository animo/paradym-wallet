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
 * - **`hwk` and `bio_strong`** when the credential that authorizes the payment is bound to a key in
 *   the secure environment. `isHardwareBoundCredentialType` decides where a credential's key is
 *   created at issuance — today the Wero Payment Attestation — and the secure environment creates that
 *   key so that every signature needs a strong biometric (iOS `biometryCurrentSet`, Android
 *   `BIOMETRIC_STRONG` with no validity window). The biometric therefore releases this credential's
 *   key for this transaction, which is what the registry asks for.
 * - **`swk`** otherwise: everything else gets an Askar key, a software key store, and [RFC8176] has a
 *   value for exactly that.
 * - **`pin`** when the user entered their PIN to release this transaction. That is a knowledge factor
 *   tied to this authorization, which is what SCA asks for.
 *
 * What is deliberately absent:
 *
 * - **A biometric value for software keys.** The biometric unlock this wallet has protects the
 *   *wallet key* that opens the store at app launch — it does not release a software key for this
 *   transaction. Reporting a session unlock as though it authorized the payment is precisely the
 *   over-claim that makes an `amr` array worthless as evidence.
 * - **The modality** (`fpt`, `face`). The platform does not say which biometric the user used.
 *
 * The consequence is worth being explicit about: where the user released a software-key transaction
 * without entering a PIN, this reports a single factor, and an Authorizing Party enforcing [PSD2]
 * will say so rather than be told two factors it cannot verify. That is the honest failure.
 */
export function resolvePasoAuthenticationMethods(options: {
  /** Whether the user entered their PIN for this transaction specifically. */
  usedTransactionPin: boolean
  /** Whether the credential that authorizes the transaction is bound to a hardware key. */
  usedHardwareBoundKey: boolean
  /**
   * Whether that key only signs after a strong biometric: the device's own secure environment does,
   * the cloud HSM fallback does not — it authenticates the user with the PIN instead.
   */
  usedKeyBiometric: boolean
}): PasoAuthenticationMethod[] {
  const methods: PasoAuthenticationMethod[] = [options.usedHardwareBoundKey ? 'hwk' : 'swk']

  if (options.usedHardwareBoundKey && options.usedKeyBiometric) methods.push('bio_strong')
  if (options.usedTransactionPin) methods.push('pin')

  return methods
}
