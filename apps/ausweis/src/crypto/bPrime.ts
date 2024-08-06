import {
  type AgentContext,
  type JwsProtectedHeaderOptions,
  JwsService,
  JwtPayload,
  type Key,
  KeyType,
  TypedArrayEncoder,
  getJwkFromKey,
} from '@credo-ts/core'
import type { FullAppAgent } from '@package/agent/src'
import { kdf } from '@package/secure-store/kdf'
import { ausweisAes256Gcm } from './aes'

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
  if (!(await ausweisAes256Gcm.aes256GcmHasKey({ agentContext }))) {
    await ausweisAes256Gcm.aes256GcmGenerateAndStoreKey({ agentContext })
  }

  const pinSecret = await ausweisAes256Gcm.aes256GcmEncrypt({
    agentContext,
    data: new Uint8Array(pin),
  })

  const pinSeed = await kdf.derive(
    TypedArrayEncoder.toUtf8String(new Uint8Array(pin)),
    TypedArrayEncoder.toUtf8String(pinSecret)
  )

  return agentContext.wallet.createKey({
    seed: TypedArrayEncoder.fromHex(pinSeed),
    keyType: KeyType.P256,
  })
}

export const createPinDerivedEphKeyPop = async (
  agent: FullAppAgent,
  { aud, cNonce, deviceKey, pinDerivedEph }: { pinDerivedEph: Key; deviceKey: Key; cNonce: string; aud: string }
) => {
  const deviceKeyClaim = getJwkFromKey(deviceKey).toJson()

  const payload = new JwtPayload({
    aud,
    additionalClaims: {
      nonce: cNonce,
      device_key: { jwk: deviceKeyClaim },
    },
  })

  const protectedHeaderOptions: JwsProtectedHeaderOptions = {
    alg: 'ES256',
    typ: 'pin_derived_eph_key_pop',
    jwk: getJwkFromKey(pinDerivedEph),
  }

  const jwsService = agent.dependencyManager.resolve<JwsService>(JwsService)

  const compact = await jwsService.createJwsCompact(agent.context, {
    key: pinDerivedEph,
    payload,
    protectedHeaderOptions,
  })

  return compact
}
