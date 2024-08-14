import { type AgentContext, TypedArrayEncoder } from '@credo-ts/core'
import { Key, KeyAlgs, KeyMethod } from '@hyperledger/aries-askar-react-native'
import { kdf } from '@package/secure-store/kdf'
import { ausweisAes128Gcm } from './aes'

/**
 *
 * Derive a key pair based on a numeric pin according to the steps in B'
 *
 * returns pin_derived_eph_pub + pin_derived_eph_priv
 *
 * @todo Might be good later to add methods like `signWithPidPin`
 *
 */
export const deriveKeypairFromPin = async (agentContext: AgentContext, pin: Array<number>) => {
  if (!(await ausweisAes128Gcm.aes128GcmHasKey({ agentContext }))) {
    throw new Error('No AES key found in storage. Flow is called in an incorrect way!')
  }

  const pinSecret = await ausweisAes128Gcm.aes128GcmEncrypt({
    agentContext,
    data: new Uint8Array(pin),
  })

  const pinSeed = await kdf.derive(
    TypedArrayEncoder.toUtf8String(new Uint8Array(pin)),
    TypedArrayEncoder.toUtf8String(pinSecret)
  )

  return Key.fromSeed({
    seed: new Uint8Array(TypedArrayEncoder.fromHex(pinSeed)),
    method: KeyMethod.None,
    algorithm: KeyAlgs.EcSecp256r1,
  })
}
