import { JsonEncoder, TypedArrayEncoder } from '@credo-ts/core'
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
 * The ephemeral private key is deleted immediately — it has no use after the derivation and keeping
 * it in the store would be the one copy that could decrypt what the wallet just sent.
 */
export async function encryptPasoRiskSignals(
  paradym: ParadymWalletSdk,
  options: {
    riskSignals: PasoRiskSignalEnvelope[]
    encryptionKey: PasoRiskSignalsEncryptionKey
  }
): Promise<string> {
  const { riskSignals, encryptionKey } = options
  const { kms } = paradym.agent

  const ephemeralKey = await kms.createKey({ type: { kty: 'EC', crv: 'P-256' } })

  try {
    // Section 7.5.1 requires `alg`, `enc` and `kid`; `epk` is what [RFC7518] Section 4.6 requires for
    // ECDH-ES and is what the issuer derives the same key from. Only the four members of the
    // ephemeral public key go in — the `kid` the key store gave it is ours, and means nothing to the
    // issuer.
    const encodedHeader = JsonEncoder.toBase64Url({
      alg: keyManagementAlgorithm,
      enc: contentEncryptionAlgorithm,
      kid: encryptionKey.kid,
      epk: { kty: 'EC', crv: 'P-256', x: ephemeralKey.publicJwk.x, y: ephemeralKey.publicJwk.y },
    })

    const encrypted = await kms.encrypt({
      key: {
        keyAgreement: {
          keyId: ephemeralKey.keyId,
          algorithm: keyManagementAlgorithm,
          externalPublicJwk: {
            kty: encryptionKey.kty,
            crv: encryptionKey.crv,
            x: encryptionKey.x,
            y: encryptionKey.y,
          },
        },
      },
      // Section 7.4 step 1 — the plaintext array of Section 2.2, serialised as it would have been
      // carried unencrypted.
      data: TypedArrayEncoder.fromUtf8String(JSON.stringify(riskSignals)),
      encryption: {
        algorithm: contentEncryptionAlgorithm,
        aad: TypedArrayEncoder.fromUtf8String(encodedHeader),
      },
    })

    if (!encrypted.iv || !encrypted.tag) {
      throw new Error('Encrypting the PaSO risk signals did not produce an iv and an authentication tag')
    }

    // The encrypted key segment is empty: ECDH-ES derives the content encryption key directly rather
    // than wrapping one, per [RFC7518] Section 4.6.
    return [
      encodedHeader,
      '',
      TypedArrayEncoder.toBase64Url(encrypted.iv),
      TypedArrayEncoder.toBase64Url(encrypted.encrypted),
      TypedArrayEncoder.toBase64Url(encrypted.tag),
    ].join('.')
  } finally {
    await kms.deleteKey({ keyId: ephemeralKey.keyId })
  }
}
