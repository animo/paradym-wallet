/** Wero Payment Attestation (WPA) Rulebook v1.0, Section 3.2. */
export const weroPaymentAttestationVct = 'https://wero.epicompany.eu/payment_attestation/v1'

/**
 * Whether a credential of this type is bound to a key in the secure environment rather than in Askar.
 *
 * WPA Rulebook Section 4.7: the WPA is the possession factor of Strong Customer Authentication and
 * "SHALL be device-bound, cryptographically bound to a key held in the Wallet Unit's Wallet Secure
 * Cryptographic Application". Matched on `vct` for now.
 */
export function isHardwareBoundCredentialType(type: string | undefined) {
  return type === weroPaymentAttestationVct
}

/** Whether the key for a credential of this configuration is created in the secure environment. */
export function isHardwareBoundCredentialConfiguration(configuration: { format: string; vct?: string }) {
  return configuration.format === 'dc+sd-jwt' && isHardwareBoundCredentialType(configuration.vct)
}
