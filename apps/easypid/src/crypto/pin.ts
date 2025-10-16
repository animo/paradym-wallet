import { transformPrivateKeyToPrivateJwk } from '@credo-ts/askar'
import { type AgentContext, Kms, TypedArrayEncoder } from '@credo-ts/core'
import { kdf } from '@package/secure-store/kdf'
import { easyPidAes256Gcm } from './aes'

/**
 *
 * Derive a key pair based on a numeric pin according to the steps in B'
 *
 * returns pin_derived_eph_pub + pin_derived_eph_priv
 *
 * @todo Might be good later to add methods like `signWithPidPin`
 *
 */
export const deriveKeypairFromPin = async (agentContext: AgentContext, pin: Array<number>, salt?: string) => {
  const pinSecret = await easyPidAes256Gcm.aes256GcmEncrypt({
    agentContext,
    data: new Uint8Array(pin),
  })

  const pinSeed = await kdf.derive(
    TypedArrayEncoder.toUtf8String(new Uint8Array(pin)),
    salt ?? TypedArrayEncoder.toUtf8String(pinSecret)
  )

  const { privateJwk } = transformPrivateKeyToPrivateJwk({
    type: {
      kty: 'EC',
      crv: 'P-256',
    },
    privateKey: TypedArrayEncoder.fromHex(pinSeed),
  })

  const jwk = Kms.PublicJwk.fromUnknown(Kms.publicJwkFromPrivateJwk(privateJwk))
  const kms = agentContext.resolve(Kms.KeyManagementApi)

  // Need to set the keyId
  jwk.keyId = jwk.legacyKeyId

  await kms.getPublicKey({ keyId: jwk.legacyKeyId }).catch(async (error) => {
    if (error instanceof Kms.KeyManagementKeyNotFoundError) {
      // FIXME: we can't assign custom kid with all backends. I think we should
      // make it a separate property so it's more explicit a key id is added.
      privateJwk.kid = jwk.legacyKeyId
      const { publicJwk } = await kms.importKey({
        privateJwk,
      })

      return publicJwk
    }

    throw error
  })

  return jwk
}
