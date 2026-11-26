/**
 * PaSO — Payments and SCA for OpenID, draft-2.
 *
 * https://aptitude-consortium.github.io/payments-and-sca-for-openid/draft-2/
 *
 * PaSO is the Aptitude Consortium's successor to the EU ARF TS 12 "SCA with the Wallet" v1.0 work.
 * The TS 12 implementation in this wallet (`urn:eudi:sca:eu.europa.ec:payment:single:1`) is
 * untouched and still works; PaSO runs alongside it under the `urn:paso:sca:` prefix.
 *
 * ## What this wallet implements
 *
 * - **[PaSO Core]** — the simple profile (Section 7.3), the SD-JWT-VC holder binding proof
 *   (Sections 6.1 and 6.2), signed-request-only (Section 3), and the rejection rule a wallet without
 *   the advanced profile owes (Section 7.4).
 * - **[PaSO Proof Metadata]** — the signed `credential-metadata+jwt`, its full verification
 *   procedure, storage in signed form with re-verification on every load, renewal before `exp`, the
 *   label and structural constraints of Section 3.3, and `metadata_integrity`.
 * - **[PaSO Proof Risk Signals]** — signal set and encryption-trigger resolution (Sections 4.1 and
 *   7.2), the two transaction-fact signals `urn:paso:risk:global:response_mode:1` and
 *   `urn:paso:risk:global:amr:1`, and encryption of the `risk_signals` array to the issuer's key
 *   (Section 7) at the `ECDH-ES` / `A256GCM` baseline of Section 7.6.
 * - **Basic Payments rulebook** — `urn:paso:sca:global:payment:1`, with payload conformance, SRI
 *   resolution of `payee.logo` under the [PaSO View] Section 3 resource limits, and a dedicated
 *   consent UI. The Wero Payment Attestation form of WPA Rulebook v1.1 Table 4.6-A (`amount` as a
 *   number with a separate `currency`) is accepted next to the PaSO form.
 * - **Basic Mandates and Generic rulebooks**, and every other type through its metadata alone — the
 *   generic rendering of [PaSO View] Sections 2 and 3, including `template:` labels and values.
 * - **Ad-hoc metadata** ([PaSO Proof Metadata] Section 5) from Relying Parties listed in the
 *   credential's `adhoc_metadata_clients`.
 *
 * ## What it deliberately does not, and why
 *
 * - **The advanced profile** ([PaSO Core] Section 7.4) — multiple PaSO entries, credential
 *   alternatives, transposable credential sets. Requests needing it are rejected with a reason
 *   rather than partially honoured, which is what Section 7.4 requires. [PaSO View] Section 1.1 asks a
 *   Wallet implementing View to support it, which is still open.
 * - **Array wildcard claim paths** ([PaSO View] Section 2) — refused rather than rendered.
 * - **The mdoc profile** ([PaSO Core] Section 6.3) — Credo signs transaction data for `dc+sd-jwt`
 *   only, so there is no path on which a `urn:paso:sca:1` DeviceSigned namespace could be produced.
 * - **Measured and device-fact risk signals** — geolocation, call activity, device motion, screen
 *   capture, device basics, app vendor id. Reported `unavailable` when a profile requires them, per
 *   [PaSO Risk Signals] Section 4.2, which also forbids treating that as an incompatibility.
 * - **Risk signal encryption algorithms beyond the baseline** ([PaSO Risk Signals] Section 7.6) —
 *   only `ECDH-ES` over `P-256` with `A256GCM` is produced. An issuer publishing nothing else under
 *   `risk_signals_encryption_keys` has no usable key as far as this wallet is concerned, and
 *   Section 7.3 then has the transaction refused rather than sent in the clear.
 * - **SVG images** ([PaSO View] Section 3) — URLs inside an SVG need the fragment-carried integrity
 *   values of [PaSO Proof SD-JWT-VC and SVG] Section 3, which we do not implement, and that section
 *   makes an unverifiable resource invalid.
 * - **The `kid` variant of the signed metadata JWT**, and with it PaSO Credentials whose issuer keys
 *   are published in a key set rather than as an `x5c` chain: the credential binding of
 *   [PaSO Proof Metadata] Section 7 step 6 has no other anchor for those.
 * - **Mandates, Generic and other non-payment types over the Digital Credentials API**, whose request
 *   UI only renders payments.
 */

export {
  loadVerifiedPasoCredentialMetadata,
  renewPasoCredentialMetadata,
  storePasoCredentialMetadata,
  type VerifiedPasoCredentialMetadata,
} from './credentialMetadata'
export { ParadymWalletPasoError, type PasoRefusalCode, type PasoRefusalDetail } from './error'
export { pasoLocalePriorityList } from './locale'
export {
  getPasoPaymentAmount,
  type PasoPaymentPayload,
  type PasoRulebook,
  type PasoRulebookClaim,
  pasoPaymentRulebook,
  pasoPaymentTransactionDataType,
  validatePasoPayloadConformance,
} from './paymentRulebook'
export type {
  PasoDetailClaim,
  PasoDisplayedClaim,
  PasoDisplayItem,
  PasoDisplayLabel,
  PasoDisplayPart,
  PasoDisplayValue,
  PasoPaymentDisplay,
} from './render'
export { createPasoScaResponseClaims } from './responseClaims'
export { encryptPasoRiskSignals, selectPasoRiskSignalsEncryptionKey } from './riskSignalEncryption'
export {
  collectPasoRiskSignals,
  pasoAuthenticationMethodsSignalType,
  pasoResponseModeSignalType,
  resolveEffectiveRiskSignalSet,
} from './riskSignals'
export { getPasoRulebook, isPasoMandateType } from './rulebooks'
export { computeSriIntegrity } from './sri'
export {
  assertPasoCredentialsOnlyForPasoTransactions,
  type FormattedTransactionDataPaso,
  type FormattedTransactionDataPasoClaims,
  type FormattedTransactionDataPasoPayment,
  hasPasoTransactionData,
  isPasoTransaction,
  resolvePasoTransactionData,
} from './transactionData'
export {
  isPasoTransactionDataType,
  type PasoAuthenticationMethod,
  type PasoClaimMetadata,
  type PasoCredentialMetadata,
  type PasoResolvedRiskSignal,
  type PasoRiskSignalEnvelope,
  type PasoRiskSignalsEncryptionKey,
  type PasoScaResponseClaims,
  type PasoTransactionDataType,
  type PasoTransactionDataTypeMetadata,
  pasoTransactionDataTypePrefix,
} from './types'
