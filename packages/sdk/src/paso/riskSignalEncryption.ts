import { JweService, Kms, TypedArrayEncoder } from '@credo-ts/core'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import type {
  PasoCredentialMetadata,
  PasoPublishedJwk,
  PasoRiskSignalEnvelope,
  PasoRiskSignalsEncryptionKey,
} from './types'

/**
 * Risk signal encryption, per [PaSO Risk Signals] Section 7.
 *
 * Where a transaction data type requires encryption — from any of the three triggers of Section 7.2,
 * resolved in {@link ./riskSignals.ts} — the whole `risk_signals` array is encrypted to the issuer's
 * public key, so a Relying Party forwarding the proof package in a third-party flow cannot read the
 * user's device and behavioural data. Only the issuer, which is or feeds the Authorizing Party, can.
 *
 * Two properties of the design are worth stating because they are what make it safe rather than
 * merely encrypted:
 *
 * - **Encrypt-then-sign** (Section 7.4). The ciphertext is placed in the claim *before* the holder
 *   binding proof is signed, so the KB-JWT signature authenticates it and binds it to this
 *   transaction. There is no separate hash of the risk signals, and none is needed.
 * - **The key comes from the verified metadata JWT** (Section 7.3). "A key that is not
 *   integrity-verified SHALL be treated as absent" — which is why the only caller reads it from the
 *   `VerifiedPasoCredentialMetadata` it just checked, never from the unsigned Credential Issuer
 *   Metadata or from the request.
 */

/** [PaSO Risk Signals] Section 7.6 — the JOSE baseline every Wallet and decryptor supports. */
const keyManagementAlgorithm = 'ECDH-ES'
const contentEncryptionAlgorithm = 'A256GCM'

/**
 * The issuer encryption key to use, or `undefined` when the issuer published none we can use.
 *
 * Section 7.3 lets the issuer publish several keys and leaves the choice to the Wallet, so this
 * takes the first that meets the Section 7.6 baseline. "Other algorithms MAY be used when the
 * published issuer key declares them" — we do not, so a key set holding only, say, an X25519 key
 * reads here as no key at all, which is the honest answer: Section 7.3 then has the Wallet refuse
 * rather than fall back to plaintext.
 */
export function selectPasoRiskSignalsEncryptionKey(
  credentialMetadata: PasoCredentialMetadata
): PasoRiskSignalsEncryptionKey | undefined {
  const keys = credentialMetadata.risk_signals_encryption_keys?.keys ?? []
  return keys.find(isBaselineEncryptionKey)
}

function isBaselineEncryptionKey(jwk: PasoPublishedJwk): jwk is PasoRiskSignalsEncryptionKey {
  return (
    jwk.kty === 'EC' &&
    jwk.crv === 'P-256' &&
    typeof jwk.x === 'string' &&
    typeof jwk.y === 'string' &&
    // Section 7.3 requires all three on a published key. `use` and `alg` are what say the issuer
    // meant this key for this, and `kid` is what the wallet has to put in the JWE header.
    typeof jwk.kid === 'string' &&
    jwk.use === 'enc' &&
    jwk.alg === keyManagementAlgorithm
  )
}

/**
 * The `risk_signals` claim value as a JWE compact string, per [PaSO Risk Signals] Section 7.5.1.
 *
 * `ECDH-ES` with a per-transaction ephemeral key, which is what makes the derived content encryption
 * key unique per proof: the same signals encrypted twice produce unrelated ciphertexts, so an
 * intermediary cannot tell from the bytes alone that two transactions carry the same measurements.
 * The key management service creates the ephemeral key for the derivation and never stores it, so
 * there is no copy left that could decrypt what the wallet just sent.
 */
export async function encryptPasoRiskSignals(
  paradym: ParadymWalletSdk,
  options: {
    riskSignals: PasoRiskSignalEnvelope[]
    encryptionKey: PasoRiskSignalsEncryptionKey
  }
): Promise<string> {
  const { riskSignals, encryptionKey } = options

  // Section 7.5.1 requires `alg`, `enc` and `kid` in the protected header. The `JweService` adds the
  // `epk` that [RFC7518] Section 4.6 requires for ECDH-ES, and leaves the encrypted key segment empty:
  // ECDH-ES derives the content encryption key directly rather than wrapping one.
  return paradym.agent.dependencyManager.resolve(JweService).encryptJweCompact(paradym.agent.context, {
    keyAgreement: {
      algorithm: keyManagementAlgorithm,
      recipient: {
        publicJwk: Kms.PublicJwk.fromUnknown({
          kty: encryptionKey.kty,
          crv: encryptionKey.crv,
          x: encryptionKey.x,
          y: encryptionKey.y,
        }),
        header: { kid: encryptionKey.kid },
      },
    },
    enc: contentEncryptionAlgorithm,
    // Section 7.4 step 1 — the plaintext array of Section 2.2, serialised as it would have been
    // carried unencrypted.
    data: TypedArrayEncoder.fromUtf8String(JSON.stringify(riskSignals)),
  })
}
