import { assertAskarWallet } from '@credo-ts/askar/build/utils/assertAskarWallet'
import {
  type AgentContext,
  Buffer,
  type JwsProtectedHeaderOptions,
  JwsService,
  JwtPayload,
  Key,
  KeyType,
  TypedArrayEncoder,
  getJwkFromKey,
} from '@credo-ts/core'
import { deviceKeyPair } from '@easypid/storage/pidPin'
import { Key as AskarKey, KeyAlgs } from '@hyperledger/aries-askar-react-native'
import type { EasyPIDAppAgent } from '@package/agent'
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
export const deriveKeypairFromPin = async (agentContext: AgentContext, pin: Array<number>) => {
  const pinSecret = await easyPidAes256Gcm.aes256GcmEncrypt({
    agentContext,
    data: new Uint8Array(pin),
  })

  const pinSeed = await kdf.derive(
    TypedArrayEncoder.toUtf8String(new Uint8Array(pin)),
    TypedArrayEncoder.toUtf8String(pinSecret)
  )

  const askarKey = AskarKey.fromSecretBytes({
    algorithm: KeyAlgs.EcSecp256r1,
    secretKey: new Uint8Array(TypedArrayEncoder.fromHex(pinSeed)),
  })

  const wallet = agentContext.wallet
  assertAskarWallet(wallet)

  await wallet.withSession(async (session) => {
    const key = await session.fetchKey({
      name: TypedArrayEncoder.toBase58(askarKey.publicBytes),
    })
    if (key) return
    await session.insertKey({
      name: TypedArrayEncoder.toBase58(askarKey.publicBytes),
      key: askarKey,
    })
  })

  return new Key(askarKey.publicBytes, KeyType.P256)
}

export const createPinDerivedEphKeyPop = async (
  agent: EasyPIDAppAgent,
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

/**
 *
 * The Wallet signs the PIN nonce concatenated with the device-bound public key dev_pub with the key pin_derived_eph_priv
 *
 */
export const signPinNonceAndDeviceKeyWithPinDerivedEphPriv = async (
  agent: EasyPIDAppAgent,
  {
    pinNonce,
    pinDerivedEphKey,
  }: {
    pinNonce: string
    pinDerivedEphKey: Key
  }
): Promise<string> => {
  const header = {
    alg: 'ES256',
    jwk: getJwkFromKey(pinDerivedEphKey).toJson(),
  }

  const payload = Buffer.from([
    ...TypedArrayEncoder.fromString(pinNonce),
    ...TypedArrayEncoder.fromString(TypedArrayEncoder.toBase64URL(deviceKeyPair.asJwkInBytes())),
  ])

  const toBeSigned = `${TypedArrayEncoder.toBase64URL(
    TypedArrayEncoder.fromString(JSON.stringify(header))
  )}.${TypedArrayEncoder.toBase64URL(payload)}`

  const signature = await agent.context.wallet.sign({
    data: TypedArrayEncoder.fromString(toBeSigned),
    key: pinDerivedEphKey,
  })

  const compact = `${toBeSigned}.${TypedArrayEncoder.toBase64URL(signature)}`

  return compact
}

/**
 *
 * The Wallet signs the PIN nonce concatenated with the Wallet PIN derived public key pin_derived_eph_pub with the key dev_priv
 *
 */
export const signPinNonceAndPinDerivedEphPubWithDeviceKey = async ({
  pinNonce,
  pinDerivedEphKey,
}: {
  pinNonce: string
  pinDerivedEphKey: Key
}): Promise<string> => {
  const pinDerivedEphPubAsJwkBytes = TypedArrayEncoder.fromString(
    JSON.stringify(getJwkFromKey(pinDerivedEphKey).toJson())
  )

  const header = { alg: 'ES256' }
  const payload = Buffer.from([
    ...TypedArrayEncoder.fromString(pinNonce),
    ...TypedArrayEncoder.fromString(TypedArrayEncoder.toBase64URL(pinDerivedEphPubAsJwkBytes)),
  ])

  const toBeSigned = `${TypedArrayEncoder.toBase64URL(
    TypedArrayEncoder.fromString(JSON.stringify(header))
  )}.${TypedArrayEncoder.toBase64URL(payload)}`

  const signature = await deviceKeyPair.sign(new Uint8Array(TypedArrayEncoder.fromString(toBeSigned)))
  const compact = `${toBeSigned}.${TypedArrayEncoder.toBase64URL(signature)}`

  return compact
}
