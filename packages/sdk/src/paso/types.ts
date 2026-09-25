/**
 * Types for PaSO — Payments and SCA for OpenID, draft-2.
 *
 * https://aptitude-consortium.github.io/payments-and-sca-for-openid/draft-2/
 *
 * PaSO is the successor of the EU ARF TS 12 / "SCA with the Wallet" v1.0 work that this wallet
 * already implements under the `urn:eudi:sca:` prefix. The two live side by side: PaSO renamed the
 * URN prefix, moved `amr`/`response_mode` out of the proof claims and into risk signals, and made
 * the signed credential metadata the only authoritative source for transaction data types.
 *
 * What this wallet implements, and what it deliberately does not, is spelled out in
 * {@link ./index.ts}.
 */

/** [PaSO Core] Section 5.2 — transaction data type identifiers. */
export const pasoTransactionDataTypePrefix = 'urn:paso:sca:'

/** [PaSO Core] Section 5.2 — `urn:paso:sca:<domain>:<suffix>:<version>`. */
export type PasoTransactionDataType = `urn:paso:sca:${string}`

/**
 * Whether a transaction data entry is targeted at PaSO at all.
 *
 * [PaSO Core] Section 5.2: "The Wallet identifies PaSO transaction data entries by checking whether
 * the `type` field starts with the prefix `urn:paso:sca:`." This is the only identification rule
 * PaSO defines — there is no credential-level one.
 */
export function isPasoTransactionDataType(type: string): type is PasoTransactionDataType {
  return type.startsWith(pasoTransactionDataTypePrefix)
}

/** [PaSO Proof Metadata] Section 3.1 — a `display` entry of a claim. */
export interface PasoDisplayEntry {
  locale?: string
  name: string
  display_type?: string
}

/** [PaSO Proof Metadata] Section 3.1 — claim metadata, [OID4VCI] Appendix B.2 plus `value_type`. */
export interface PasoClaimMetadata {
  path: Array<string | null>
  mandatory?: boolean
  display?: PasoDisplayEntry[]
  value_type?: string
}

/** [PaSO Proof Metadata] Section 3.2 — one localised value of a UI element. */
export interface PasoUiLabelEntry {
  locale?: string
  value: string
  value_type?: string
}

/**
 * [PaSO Proof Metadata] Section 3.2 — the consent screen labels.
 *
 * Keys other than the four PaSO defines are ignored, per the same section.
 */
export type PasoUiLabels = Record<string, PasoUiLabelEntry[] | undefined>

/** [PaSO Risk Signals] Section 4.1 step 3 — a metadata-level enumeration entry. */
export interface PasoRiskSignalEnumerationEntry {
  type: string
  required?: boolean
  max_age?: number
}

/**
 * [PaSO Risk Signals] Section 3.3 — a transcribed risk signal profile.
 *
 * `encrypted` belongs to the profile, not to the signals: Section 7.2 item 3 makes a profile one of
 * the three independent things that can require encryption for a transaction data type.
 */
export interface PasoRiskSignalProfile {
  encrypted?: boolean
  signals: PasoRiskSignalEnumerationEntry[]
}

/** [PaSO Proof Metadata] Section 3 — one entry of `transaction_data_types`. */
export interface PasoTransactionDataTypeMetadata {
  claims: PasoClaimMetadata[]
  ui_labels?: PasoUiLabels
  risk_signal_profiles?: string[]
  risk_signals?: PasoRiskSignalEnumerationEntry[]
  encrypted?: boolean
}

/**
 * [PaSO Risk Signals] Section 7.3 — a key of the issuer's `risk_signals_encryption_keys` JWK Set.
 *
 * Everything is optional because this is what the issuer published, not what we can use. Section 7.3
 * asks for `use`, `kid` and `alg` on every key, and Section 7.6 fixes the baseline to `ECDH-ES` over
 * `P-256`; {@link ./riskSignalEncryption.ts} is where a published key is checked against that and
 * narrowed to {@link PasoRiskSignalsEncryptionKey}.
 */
export interface PasoPublishedJwk {
  kty?: string
  crv?: string
  x?: string
  y?: string
  use?: string
  kid?: string
  alg?: string
}

/** A published key that meets the [PaSO Risk Signals] Section 7.6 baseline, ready to encrypt to. */
export interface PasoRiskSignalsEncryptionKey {
  kty: 'EC'
  crv: 'P-256'
  x: string
  y: string
  kid: string
  use?: string
  alg?: string
}

/** [PaSO Proof Metadata] Section 3 — `credential_metadata` extended with `transaction_data_types`. */
export interface PasoCredentialMetadata {
  display?: Array<Record<string, unknown>>
  transaction_data_types: Record<string, PasoTransactionDataTypeMetadata>
  /** [PaSO Risk Signals] Section 7.3 — the issuer's encryption keys, as a [RFC7517] JWK Set. */
  risk_signals_encryption_keys?: { keys?: PasoPublishedJwk[] }
  [key: string]: unknown
}

/** [PaSO Proof Metadata] Section 4 — the payload of the signed credential metadata JWT. */
export interface PasoSignedCredentialMetadataPayload {
  iss: string
  sub: string
  format: string
  iat: number
  exp: number
  credential_metadata_uri: string
  credential_metadata: PasoCredentialMetadata
}

/** [PaSO Risk Signals] Section 2.3. */
export type PasoRiskSignalStatus = 'ok' | 'unavailable' | 'denied'

/** A JSON value, as a risk signal value or a proof claim must be to survive serialisation. */
export type PasoJsonValue = string | number | boolean | null | PasoJsonValue[] | { [key: string]: PasoJsonValue }

/**
 * [PaSO Risk Signals] Section 2.2 — the signal envelope.
 *
 * A type alias rather than an interface on purpose: only aliases get the implicit index signature
 * that makes them assignable to Credo's `JsonObject`, which is how these reach the KB-JWT.
 */
export type PasoRiskSignalEnvelope = {
  type: string
  collected_at: string
  status: PasoRiskSignalStatus
  /** Present if and only if `status` is `ok`. Its shape is defined per signal type. */
  value?: PasoJsonValue
}

/** [PaSO Risk Signals] Section 4.1 — one entry of the resolved effective signal set. */
export interface PasoResolvedRiskSignal {
  type: string
  required: boolean
  maxAge?: number
}

/**
 * [PaSO Risk Signal Registry] Section 2.8 — values for `urn:paso:risk:global:amr:1`.
 *
 * [RFC8176] values plus the two biometric strength values the registry adds.
 */
export type PasoAuthenticationMethod =
  | 'pin'
  | 'pwd'
  | 'hwk'
  | 'swk'
  | 'otp'
  | 'bio_strong'
  | 'bio_weak'
  | 'fpt'
  | 'face'
  | 'iris'

/**
 * [PaSO Core] Section 6.1 — the SCA response claims.
 *
 * Carried as top-level claims of the KB-JWT for [SD-JWT-VC] (Section 6.2). The mdoc profile
 * (Section 6.3) is not implemented; see {@link ./index.ts}.
 */
export type PasoScaResponseClaims = {
  jti: string
  display_locale: string
  transaction_data_hash: string
  transaction_data_hash_alg: string
  metadata_integrity?: string
  request_integrity: string
  wallet_instance_version: string
  /**
   * The signal envelopes, or a JWE compact string when encryption is required.
   *
   * [PaSO Risk Signals] Section 7.5.1: where the transaction data type requires encryption the claim
   * value "SHALL be a [JWE] in compact serialization (a string) instead of the JSON array".
   */
  risk_signals?: PasoRiskSignalEnvelope[] | string
}
