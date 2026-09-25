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
 *   7.2), and the two transaction-fact signals `urn:paso:risk:global:response_mode:1` and
 *   `urn:paso:risk:global:amr:1`.
 * - **Basic Payments rulebook** — `urn:paso:sca:global:payment:1`, with payload conformance, SRI
 *   resolution of `payee.logo` under the [PaSO View] Section 3 resource limits, and a dedicated
 *   consent UI.
 *
 * ## What it deliberately does not, and why
 *
 * - **[PaSO View]** — the metadata-driven generic renderer. View Section 1.1 allows a wallet that
 *   implements a rulebook to use a dedicated UI instead, and *not* implementing View is what leaves
 *   the advanced profile optional for us: "A Wallet implementing PaSO View SHALL support the
 *   advanced profile defined in [PaSO Core] Section 7.4."
 * - **The advanced profile** ([PaSO Core] Section 7.4) — multiple PaSO entries, credential
 *   alternatives, transposable credential sets. Requests needing it are rejected with a reason
 *   rather than partially honoured, which is what Section 7.4 requires.
 * - **The mdoc profile** ([PaSO Core] Section 6.3) — Credo signs transaction data for `dc+sd-jwt`
 *   only, so there is no path on which a `urn:paso:sca:1` DeviceSigned namespace could be produced.
 * - **`template:mini_markdown` labels** ([PaSO View] Section 3) — placeholder interpolation needs the
 *   generic renderer. Section 3 says such a `display` entry is excluded from locale matching, so a
 *   provider that also serves a plain label for some locale still resolves; one that serves nothing
 *   else does not, and the transaction is refused for want of a locale.
 * - **Measured and device-fact risk signals** — geolocation, call activity, device motion, screen
 *   capture, device basics, app vendor id. Reported `unavailable` when a profile requires them, per
 *   [PaSO Risk Signals] Section 4.2, which also forbids treating that as an incompatibility.
 * - **Risk signal encryption** ([PaSO Risk Signals] Section 7) — a transaction data type that
 *   requires it, from any of the three sources of Section 7.2, is refused: Section 7.3 forbids
 *   falling back to plaintext. Note that this makes the published Default risk signal profile
 *   unusable here, since it sets `encrypted`.
 * - **SVG images** ([PaSO View] Section 3) — URLs inside an SVG need the fragment-carried integrity
 *   values of [PaSO Proof SD-JWT-VC and SVG] Section 3, which we do not implement, and that section
 *   makes an unverifiable resource invalid.
 * - **The `kid` variant of the signed metadata JWT**, and with it PaSO Credentials whose issuer keys
 *   are published in a key set rather than as an `x5c` chain: the credential binding of
 *   [PaSO Proof Metadata] Section 7 step 6 has no other anchor for those.
 * - **The Generic and Mandate rulebooks**, and PaSO over the Digital Credentials API, which does not
 *   carry transaction data in this wallet yet.
 */

export {
  loadVerifiedPasoCredentialMetadata,
  renewPasoCredentialMetadata,
  storePasoCredentialMetadata,
  type VerifiedPasoCredentialMetadata,
} from './credentialMetadata'
export { ParadymWalletPasoError, type PasoRefusalCode } from './error'
export { pasoLocalePriorityList } from './locale'
export {
  getPasoRulebook,
  type PasoPaymentPayload,
  type PasoRulebook,
  type PasoRulebookClaim,
  pasoPaymentRulebook,
  pasoPaymentTransactionDataType,
  validatePasoPayloadConformance,
} from './paymentRulebook'
export { createPasoScaResponseClaims } from './responseClaims'
export {
  collectPasoRiskSignals,
  pasoAuthenticationMethodsSignalType,
  pasoResponseModeSignalType,
  resolveEffectiveRiskSignalSet,
} from './riskSignals'
export { computeSriIntegrity } from './sri'
export {
  type FormattedTransactionDataPasoPayment,
  hasPasoTransactionData,
  type PasoDisplayedClaim,
  resolvePasoTransactionData,
} from './transactionData'
export {
  isPasoTransactionDataType,
  type PasoAuthenticationMethod,
  type PasoClaimMetadata,
  type PasoCredentialMetadata,
  type PasoResolvedRiskSignal,
  type PasoRiskSignalEnvelope,
  type PasoScaResponseClaims,
  type PasoTransactionDataType,
  type PasoTransactionDataTypeMetadata,
  pasoTransactionDataTypePrefix,
} from './types'
