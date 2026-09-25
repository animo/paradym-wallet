import { utils } from '@credo-ts/core'
import { getWalletInstanceVersion } from '../config/walletInstanceVersion'
import { collectPasoRiskSignals } from './riskSignals'
import { computeSriIntegrity } from './sri'
import type { FormattedTransactionDataPasoPayment } from './transactionData'
import type { PasoAuthenticationMethod, PasoScaResponseClaims } from './types'

/**
 * The holder binding proof claims, per [PaSO Core] Section 6.
 *
 * For [SD-JWT-VC] these are top-level claims of the Key Binding JWT (Section 6.2), which is why they
 * are handed to Credo as the presentation's `additionalPayload` rather than signed here. The mdoc
 * profile (Section 6.3) is not implemented: Credo only signs transaction data for `dc+sd-jwt`, so
 * there is no path on which a `urn:paso:sca:1` DeviceSigned namespace could be produced.
 *
 * `response_mode` and `amr` are conspicuously absent as claims of their own — in draft-2 they are
 * risk signals, carried inside `risk_signals`, and only when a referenced profile or a metadata
 * enumeration requires them. See {@link ./riskSignals.ts}.
 */
export function createPasoScaResponseClaims(options: {
  /** The resolved proof material of the transaction the user consented to. */
  proof: NonNullable<FormattedTransactionDataPasoPayment['proof']>
  /** The signed Authorization Request ([JAR] Request Object) in compact serialisation. */
  signedRequest: string
  /** The `response_mode` of the Authorization Request, as given or defaulted. */
  responseMode: string
  /** How the user released the transaction. */
  authenticationMethods: PasoAuthenticationMethod[]
  /**
   * When the user completed authentication.
   *
   * [PaSO Risk Signal Registry] Section 2.8 makes this the `amr` signal's `collected_at`, so it is
   * the moment the user authenticated rather than the moment the claims are assembled. The two are
   * usually close together, and a signal's `collected_at` is not the place to round.
   */
  authenticatedAt: Date
}): PasoScaResponseClaims {
  const { proof, signedRequest, responseMode, authenticationMethods, authenticatedAt } = options

  return {
    // [RFC7519] Section 4.1.7 — fresh and unique per presentation. Under [PSD2] this doubles as the
    // Authentication Code, and the Authorizing Party keeps a replay cache keyed on it.
    jti: utils.uuid(),

    display_locale: proof.displayLocale,
    transaction_data_hash: proof.transactionDataHash,
    transaction_data_hash_alg: proof.transactionDataHashAlgorithm,

    // Conditional per Section 6.1: required exactly when a signed metadata JWT was used to display
    // the transaction. A transaction resolved without one has no `proof` to get here with.
    metadata_integrity: proof.metadataIntegrity,

    // Over the compact-serialised request JWT — the bytes as received, not a re-serialisation.
    request_integrity: computeSriIntegrity(signedRequest),

    wallet_instance_version: getWalletInstanceVersion(),

    risk_signals: collectPasoRiskSignals(proof.effectiveRiskSignalSet, {
      responseMode,
      authenticationMethods,
      authenticatedAt,
    }),
  }
}
