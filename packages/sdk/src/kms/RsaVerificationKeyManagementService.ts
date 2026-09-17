import type { AgentContext } from '@credo-ts/core'
import { Kms } from '@credo-ts/core'
import { constants, createPublicKey, verify } from 'react-native-quick-crypto'

const rsaSignatureAlgorithms = ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'] as const
type RsaSignatureAlgorithm = (typeof rsaSignatureAlgorithms)[number]

function isRsaSignatureAlgorithm(algorithm: Kms.KnownJwaSignatureAlgorithm): algorithm is RsaSignatureAlgorithm {
  return (rsaSignatureAlgorithms as readonly string[]).includes(algorithm)
}

/** The digest each RSA JWA signature algorithm is defined over. */
const digestForAlgorithm = {
  RS256: 'sha256',
  RS384: 'sha384',
  RS512: 'sha512',
  PS256: 'sha256',
  PS384: 'sha384',
  PS512: 'sha512',
} as const satisfies Record<RsaSignatureAlgorithm, string>

/**
 * Verifies RSA signatures, and nothing else.
 *
 * Neither askar nor the secure environment can do RSA at all, so without this backend an RSA
 * signature is not "invalid" — it cannot be checked, and Credo's KMS throws before it gets to the
 * signature. That surfaces in confusing ways: `X509ChainBuilder` swallows the error while it walks
 * the chain and simply never finds the issuer, so an mdoc signed under an RSA CA fails with
 * "Could not parse the full chain. Likely due to incorrect ordering" rather than anything about RSA.
 *
 * Only verification is implemented. RSA private keys are never created, imported, stored or signed
 * with by this wallet — the keys reaching this backend are public keys read out of someone else's
 * X.509 certificate, and they are passed in as a JWK on every call rather than referenced by key id.
 *
 * The RSA maths itself comes from `react-native-quick-crypto` (OpenSSL through Nitro), because
 * there is no RSA in Hermes and doing modular exponentiation over a 4096-bit modulus in JS is not
 * worth the code.
 */
export class RsaVerificationKeyManagementService implements Kms.KeyManagementService {
  public static readonly backend = 'rsaVerification'
  public readonly backend = RsaVerificationKeyManagementService.backend

  public isOperationSupported(_agentContext: AgentContext, operation: Kms.KmsOperation): boolean {
    return operation.operation === 'verify' && isRsaSignatureAlgorithm(operation.algorithm)
  }

  public async verify(_agentContext: AgentContext, options: Kms.KmsVerifyOptions): Promise<Kms.KmsVerifyReturn> {
    const { algorithm, data, signature } = options

    if (!isRsaSignatureAlgorithm(algorithm)) {
      throw new Kms.KeyManagementAlgorithmNotSupportedError(`algorithm '${algorithm}'`, this.backend)
    }

    // This backend stores no keys, so there is no key id to resolve one by.
    const publicJwk = options.key.publicJwk
    if (!publicJwk) {
      throw new Kms.KeyManagementError(
        `Backend '${this.backend}' can only verify with a public JWK provided on the call, not with a key id.`
      )
    }

    if (publicJwk.kty !== 'RSA') {
      throw new Kms.KeyManagementAlgorithmNotSupportedError(`kty '${publicJwk.kty}'`, this.backend)
    }

    // Guards the key is long enough for the digest (RS512 needs 4096 bits), that an `alg` on the
    // JWK is not being contradicted, and that the key is not marked encryption-only.
    Kms.assertAllowedSigningAlgForKey(publicJwk, algorithm)
    Kms.assertKeyAllowsVerify(publicJwk)

    try {
      // Only the public components: quick-crypto's JWK import reads `d` as a private key, and
      // nothing here should ever hold one.
      const key = createPublicKey({
        format: 'jwk',
        key: { kty: 'RSA', n: publicJwk.n, e: publicJwk.e },
      })

      // PKCS#1 v1.5 is the default padding; PSS has to be asked for, with the salt length RFC 7518
      // fixes to the digest length.
      const keyInput = algorithm.startsWith('PS')
        ? {
            key,
            padding: constants.RSA_PKCS1_PSS_PADDING,
            saltLength: Number.parseInt(algorithm.slice(2), 10) / 8,
          }
        : key

      const verified = verify(digestForAlgorithm[algorithm], data, keyInput, signature)

      return verified ? { verified: true, publicJwk } : { verified: false }
    } catch (error) {
      if (error instanceof Kms.KeyManagementError) throw error
      throw new Kms.KeyManagementError('Error verifying with key', { cause: error as Error })
    }
  }

  public async getPublicKey(_agentContext: AgentContext, _keyId: string): Promise<Kms.KmsJwkPublic | null> {
    // No keys are stored in this backend, so it never resolves a key id.
    return null
  }

  public async createKey(): Promise<Kms.KmsCreateKeyReturn> {
    throw new Kms.KeyManagementError(`Creating a key is not supported for backend '${this.backend}'`)
  }

  public async importKey(): Promise<Kms.KmsImportKeyReturn<Kms.KmsJwkPrivate>> {
    throw new Kms.KeyManagementError(`Importing a key is not supported for backend '${this.backend}'`)
  }

  public async deleteKey(): Promise<boolean> {
    throw new Kms.KeyManagementError(`Deleting a key is not supported for backend '${this.backend}'`)
  }

  public async sign(): Promise<Kms.KmsSignReturn> {
    throw new Kms.KeyManagementError(`Signing is not supported for backend '${this.backend}'`)
  }

  public async encrypt(): Promise<Kms.KmsEncryptReturn> {
    throw new Kms.KeyManagementError(`Encryption is not supported for backend '${this.backend}'`)
  }

  public async decrypt(): Promise<Kms.KmsDecryptReturn> {
    throw new Kms.KeyManagementError(`Decryption is not supported for backend '${this.backend}'`)
  }

  public randomBytes(): Kms.KmsRandomBytesReturn {
    throw new Kms.KeyManagementError(`Generating random bytes is not supported for backend '${this.backend}'`)
  }
}
