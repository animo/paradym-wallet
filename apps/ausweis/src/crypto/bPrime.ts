import { seedCredentialStorage } from '@ausweis/storage'
import { deviceKeyPair } from '@ausweis/storage/pidPin'
import { ReceivePidUseCaseBPrimeFlow } from '@ausweis/use-cases/ReceivePidUseCaseBPrimeFlow'
import { assertAskarWallet } from '@credo-ts/askar/build/utils/assertAskarWallet'
import {
  type AgentContext,
  type JwkJson,
  type JwsProtectedHeaderOptions,
  JwsService,
  JwtPayload,
  Key,
  KeyType,
  P256Jwk,
  TypedArrayEncoder,
  getJwkFromJson,
  getJwkFromKey,
  utils,
} from '@credo-ts/core'
import { Buffer } from '@credo-ts/core'
import { Key as AskarKey, KeyAlgs } from '@hyperledger/aries-askar-react-native'
import {
  type FullAppAgent,
  SdJwtVcRecord,
  extractOpenId4VcCredentialMetadata,
  setOpenId4VcCredentialMetadata,
} from '@package/agent'
import { kdf } from '@package/secure-store/kdf'
import { getCreateJwtCallback } from 'packages/agent/src/invitation/handler'
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
  const pinSecret = await ausweisAes256Gcm.aes256GcmEncrypt({
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

/**
 *
 * The Wallet signs the PIN nonce concatenated with the device-bound public key dev_pub with the key pin_derived_eph_priv
 *
 */
export const signPinNonceAndDeviceKeyWithPinDerivedEphPriv = async (
  agent: FullAppAgent,
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

  console.log('pin_signed_nonce')
  console.log(compact)

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

  console.log('device_key_signed_nonce')
  console.log(compact)

  return compact
}

export const requestToPidProvider = async (
  endpoint: string,
  agent: FullAppAgent,
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
  agent: FullAppAgent,
  {
    audience,
    nonce: nonceFromArgs,
  }: {
    audience: string
    nonce?: string
  }
) => {
  const nonce = nonceFromArgs ?? (await fetchPidIssuerNonce(audience))

  const askarKey = AskarKey.fromSecretBytes({
    algorithm: KeyAlgs.EcSecp256r1,
    secretKey: new Uint8Array(
      TypedArrayEncoder.fromHex('ad38184e0d5d9af97b023b6421707dc079f7d66a185bfd4c589837e3cb69fbfa')
    ),
  })

  const wallet = agent.context.wallet
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

  const key = new Key(askarKey.publicBytes, KeyType.P256)

  const exp = new Date()
  exp.setMinutes(exp.getMinutes() + 4)

  const payload = {
    iss: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
    sub: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
    exp: Math.floor(exp.getTime() / 1000),
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
    nonce: nonceFromArgs ? undefined : nonce,
    pid_issuer_nonce: nonce,
  }

  const popPayloadString = TypedArrayEncoder.toBase64URL(
    TypedArrayEncoder.fromString(JSON.stringify(clientAttestationPopJwtPayload))
  )
  const popHeaderString = TypedArrayEncoder.toBase64URL(TypedArrayEncoder.fromString(JSON.stringify({ alg: 'ES256' })))
  const popToBeSigned = `${popHeaderString}.${popPayloadString}`
  const popSignature = await deviceKeyPair.sign(new Uint8Array(TypedArrayEncoder.fromString(popToBeSigned)))
  const popJwtCompact = `${popToBeSigned}.${TypedArrayEncoder.toBase64URL(popSignature)}`

  console.log('pop jwt')
  console.log(popJwtCompact)

  return `${jwtCompact}~${popJwtCompact}`
}

export const requestSdJwtVcFromSeedCredential = async ({
  agent,
  authorizationRequestUri,
  pidPin,
}: {
  agent: FullAppAgent
  authorizationRequestUri: string
  pidPin: string
}) => {
  await agent.context.wallet.createKey({
    keyType: KeyType.P256,
    privateKey: TypedArrayEncoder.fromHex('ad38184e0d5d9af97b023b6421707dc079f7d66a185bfd4c589837e3cb69fbfc'),
  })
  const record = await agent.sdJwtVc.store(
    'eyJ0eXAiOiJ2YytzZC1qd3QiLCJraWQiOiJkaWQ6a2V5OnpEbmFldHEzTktxVFJ4RFFTOVV1Y0xQeTFteWpKZGc1alBtRjdLV05KanJ5SjVRbVMjekRuYWV0cTNOS3FUUnhEUVM5VXVjTFB5MW15akpkZzVqUG1GN0tXTkpqcnlKNVFtUyIsImFsZyI6IkhTMjU2In0.eyJpc3MiOiJkaWQ6a2V5OnpEbmFldHEzTktxVFJ4RFFTOVV1Y0xQeTFteWpKZGc1alBtRjdLV05KanJ5SjVRbVMiLCJpYXQiOjE3MjQ1MjQxODksInZjdCI6IkV4YW1wbGVDcmVkZW50aWFscyIsImlkIjoiMTIzNCIsImNuZiI6eyJqd2siOnsia3R5IjoiRUMiLCJjcnYiOiJQLTI1NiIsIngiOiJtb08wSkVCT1dpaTVNdkhUWTFFWFZ5d1BuQjdrRUpFWURlOVh3Q01vMGhnIiwieSI6Ikg1MGFlMTdxcHozMUVldm1NUnpyMDJRcU9yVTM2RGlwOThocnQtR2E0ZFUifX0sIl9zZCI6WyJLTmppc1JqYi1nY2U0TTg3YVlCUUhMdWVPRGNiNG9Wb0drdkNzM202dkY4IiwiV1Q2cENHdE00aDUwWUV5cFRnZnlIREViX3Z4LURKc1N3aWkzSXI2VFQ5WSIsImlTV1pJZkdlanprMm5odnpUSnVEdm5HU195WmNCNGxkQkFiMlZLS0FrbkEiXSwiX3NkX2FsZyI6IlNIQS0yNTYifQ.PgQOlUIve7Y9vGq7SBevEmmylpAqIB6chFuiUQwmwl4~WyJlZTViYmE5MTdiYWFmZjI4IiwiZmlyc3RuYW1lIiwiSm9obiJd~WyJhYTI3OTUwZjA1OWE0NjFhIiwibGFzdG5hbWUiLCJEb2UiXQ~WyI1MWUxN2FiZjJlZjEwZGViIiwic3NuIiwiMTIzLTQ1LTY3ODkiXQ~'
  )

  // TODO: enable this for the B' presentation issuance flow
  // const issuer = 'https://demo.pid-issuer.bundesdruckerei.de/b1'
  // const pinNonce = await fetchPidIssuerNonce(issuer)
  // const resolvedCredentialOffer = await agent.modules.openId4VcHolder.resolveCredentialOffer(
  //   ReceivePidUseCaseBPrimeFlow.SD_JWT_VC_OFFER
  // )
  // const pinDerivedEphKey = await deriveKeypairFromPin(agent.context, pidPin.split('').map(Number))

  // const clientAttestation = await createMockedClientAttestationAndProofOfPossession(agent, {
  //   audience: issuer,
  //   nonce: pinNonce,
  // })

  // const seedCredential = (await seedCredentialStorage.get(agent))?.seedCredential

  // const pinSignedNonce = await signPinNonceAndDeviceKeyWithPinDerivedEphPriv(agent, {
  //   pinNonce,
  //   pinDerivedEphKey,
  // })
  // const deviceKeySignedNonce = await signPinNonceAndPinDerivedEphPubWithDeviceKey({
  //   pinDerivedEphKey,
  //   pinNonce,
  // })

  // const tokenResponse = await agent.modules.openId4VcHolder.requestToken({
  //   resolvedCredentialOffer,
  //   // @ts-ignore
  //   dPopKeyJwk: P256Jwk.fromJson(deviceKeyPair.asJwk() as unknown as JwkJson),
  //   getCreateJwtCallback,
  //   customBody: {
  //     grant_type: 'seed_credential',
  //     client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-client-attestation',
  //     client_assertion: clientAttestation,
  //     seed_credential: seedCredential,
  //     pin_signed_nonce: pinSignedNonce,
  //     device_key_signed_nonce: deviceKeySignedNonce,
  //     client_id: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
  //   },
  // })

  // const resolvedAuthorizationRequest =
  //   await agent.modules.openId4VcHolder.resolveSiopAuthorizationRequest(authorizationRequestUri)
  // const rpEphPub = resolvedAuthorizationRequest.authorizationRequest.authorizationRequest.payload.rp_eph_pub
  // if (!rpEphPub) {
  //   throw new Error('rp_eph_pub not found in the payload of the authorization request')
  // }

  // const key = await agent.context.wallet.createKey({
  //   keyType: KeyType.P256,
  // })
  // const kbEphPub = getJwkFromKey(key).toJson()

  // const offeredCredentialToRequest = resolvedCredentialOffer.offeredCredentials.find((i) => i.id === 'sd-jwt-vc-pid')

  // if (!offeredCredentialToRequest) {
  //   throw new Error('Could not find an sd-jwt-vc-pid')
  // }

  // const credentialAndNotifications = await agent.modules.openId4VcHolder.requestCredentials({
  //   resolvedCredentialOffer,
  //   credentialBindingResolver: async ({ keyType, supportsJwk }) => {
  //     if (!supportsJwk) {
  //       throw Error('Issuer does not support JWK')
  //     }

  //     if (keyType !== KeyType.P256) {
  //       throw new Error(`invalid key type used '${keyType}' and only  ${KeyType.P256} is allowed.`)
  //     }

  //     return {
  //       method: 'jwk',
  //       jwk: getJwkFromKey(key),
  //     }
  //   },
  //   ...tokenResponse,
  //   additionalCredentialRequestPayloadClaims: {
  //     rp_eph_pub: { jwk: rpEphPub },
  //     kb_eph_pub: { jwk: kbEphPub },
  //   },
  // })

  // const [firstCredential] = credentialAndNotifications
  // if (!firstCredential) throw new Error('Error retrieving credential.')

  // let record: SdJwtVcRecord

  // // TODO: add claimFormat to SdJwtVc
  // if ('compact' in firstCredential.credential) {
  //   record = new SdJwtVcRecord({
  //     compactSdJwtVc: firstCredential.credential.compact,
  //   })
  // } else {
  //   throw new Error('Only sd-jwt-vc is allowed')
  // }

  // const openId4VcMetadata = extractOpenId4VcCredentialMetadata(offeredCredentialToRequest, {
  //   id: resolvedCredentialOffer.metadata.issuer,
  //   display: resolvedCredentialOffer.metadata.credentialIssuerMetadata.display,
  // })

  // setOpenId4VcCredentialMetadata(record, openId4VcMetadata)

  return record
}
