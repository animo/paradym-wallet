// The leaf rather than the barrel: the credential request UI imports this through the SDK options,
// and the barrel would pull the entire SDK into its bundle.
import { resolveSdJwtVcTypes } from '@paradym/wallet-sdk/config/typeMetadata'

/** Wero Payment Attestation (WPA) Rulebook v1.0, Section 3.2. */
export const weroPaymentAttestationVct = 'https://wero.epicompany.eu/payment_attestation/v1'

/**
 * Where the WPA type metadata is fetched from until its publisher serves it at the `vct` itself
 * (`wero.epicompany.eu` doesn't answer). A bank's own type that extends the WPA type can't be
 * resolved without it. The Animo playground serves a copy.
 */
export const sdJwtVcTypeMetadataLocations = {
  [weroPaymentAttestationVct]: 'https://eudi-payments.animo.id/api/vct/wero/payment_attestation/v1',
}

/**
 * Whether a credential of this type is bound to a key in the secure environment rather than in Askar.
 *
 * WPA Rulebook Section 4.7: the WPA is the possession factor of Strong Customer Authentication and
 * "SHALL be device-bound, cryptographically bound to a key held in the Wallet Unit's Wallet Secure
 * Cryptographic Application". A bank's own type that extends the WPA type is a WPA too, so `types`
 * is the credential's `vct` and every type it extends.
 */
export function isHardwareBoundCredentialType(types: Array<string | undefined>) {
  return types.includes(weroPaymentAttestationVct)
}

/**
 * Whether the key for a credential of this configuration is created in the secure environment. There
 * is no credential yet to read the `extends` chain from, so it is resolved from the type metadata.
 */
export async function isHardwareBoundCredentialConfiguration(configuration: { format: string; vct?: string }) {
  if (configuration.format !== 'dc+sd-jwt' || !configuration.vct) return false
  return isHardwareBoundCredentialType(await resolveSdJwtVcTypes(configuration.vct))
}
