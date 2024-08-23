import {
  type AgentContext,
  type JwsProtectedHeaderOptions,
  JwsService,
  JwtPayload,
  type Key,
  KeyType,
  TypedArrayEncoder,
  getJwkFromKey,
  utils,
} from '@credo-ts/core'
import { Buffer } from '@credo-ts/core'
import { deviceKeyPair } from '@easypid/storage/pidPin'
import { ReceivePidUseCaseBPrimeFlow } from '@easypid/use-cases/ReceivePidUseCaseBPrimeFlow'
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

  return agentContext.wallet.createKey({
    privateKey: TypedArrayEncoder.fromHex(pinSeed),
    keyType: KeyType.P256,
  })
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

export const requestToPidProvider = async (
  endpoint: string,
  agent: EasyPIDAppAgent,
  pinDerivedEphKey: Key,
  pinNonce: string
) => {
  const pin_signed_nonce = await signPinNonceAndDeviceKeyWithPinDerivedEphPriv(agent, {
    pinNonce,
    pinDerivedEphKey,
  })
  const device_key_signed_nonce = await signPinNonceAndPinDerivedEphPubWithDeviceKey({
    pinDerivedEphKey,
    pinNonce,
  })

  const body = {
    pin_signed_nonce,
    device_key_signed_nonce,
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.ok) {
    const url = new URL(response.url)
    const code = url.searchParams.get('code')
    if (code) {
      return code
    }
    throw Error('Could not extract the code from the returned URL')
  }
  const txt = await response.text()
  throw Error(txt)
}

const fetchPidIssuerNonce = async (issuer: string): Promise<string> => {
  const response = await fetch(`${issuer}/nonce`, { method: 'POST' })

  if (response.ok) {
    const parsed = await response.json()
    return parsed.nonce
  }

  throw Error(await response.text())
}

export const createMockedClientAttestationAndProofOfPossession = async (
  agent: EasyPIDAppAgent,
  {
    audience,
  }: {
    audience: string
  }
) => {
  const nonce = await fetchPidIssuerNonce(audience)
  const key = await agent.context.wallet.createKey({
    keyType: KeyType.P256,
    privateKey: TypedArrayEncoder.fromHex('ad38184e0d5d9af97b023b6421707dc079f7d66a185bfd4c589837e3cb69fbfa'),
  })
  const payload = {
    iss: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
    sub: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
    exp: Math.floor(new Date().getTime() / 1000 + 100),
    cnf: {
      jwk: deviceKeyPair.asJwk(),
    },
  }

  const header = {
    alg: 'ES256',
  }

  const payloadString = TypedArrayEncoder.toBase64URL(TypedArrayEncoder.fromString(JSON.stringify(payload)))
  const headerString = TypedArrayEncoder.toBase64URL(TypedArrayEncoder.fromString(JSON.stringify(header)))
  const toBeSigned = `${headerString}.${payloadString}`
  const signature = await agent.context.wallet.sign({
    key,
    data: TypedArrayEncoder.fromString(toBeSigned),
  })
  const jwtCompact = `${toBeSigned}.${TypedArrayEncoder.toBase64URL(signature)}`

  const clientAttestationPopJwtPayload = {
    iss: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
    exp: Math.floor(new Date().getTime() / 1000 + 100),
    jti: utils.uuid(),
    aud: audience,
    nonce: nonce,
  }

  const popPayloadString = TypedArrayEncoder.toBase64URL(
    TypedArrayEncoder.fromString(JSON.stringify(clientAttestationPopJwtPayload))
  )
  const popHeaderString = TypedArrayEncoder.toBase64URL(TypedArrayEncoder.fromString(JSON.stringify({ alg: 'ES256' })))
  const popToBeSigned = `${popHeaderString}.${popPayloadString}`
  const popSignature = await deviceKeyPair.sign(new Uint8Array(TypedArrayEncoder.fromString(popToBeSigned)))
  const popJwtCompact = `${popToBeSigned}.${TypedArrayEncoder.toBase64URL(popSignature)}`

  return `${jwtCompact}~${popJwtCompact}`
}
