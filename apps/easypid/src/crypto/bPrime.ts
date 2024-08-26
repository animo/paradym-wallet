import { assertAskarWallet } from '@credo-ts/askar/build/utils/assertAskarWallet'
import {
  type AgentContext,
  Buffer,
  type JwkJson,
  type JwsProtectedHeaderOptions,
  JwsService,
  JwtPayload,
  Key,
  KeyType,
  P256Jwk,
  SdJwtVcRecord,
  TypedArrayEncoder,
  getJwkFromKey,
  utils,
} from '@credo-ts/core'
import { type SeedCredentialPidData, seedCredentialStorage } from '@easypid/storage'
import { deviceKeyPair } from '@easypid/storage/pidPin'
import { ReceivePidUseCaseFlow } from '@easypid/use-cases/ReceivePidUseCaseFlow'
import { Key as AskarKey, KeyAlgs } from '@hyperledger/aries-askar-react-native'
import {
  type EasyPIDAppAgent,
  type OpenId4VcCredentialMetadata,
  extractOpenId4VcCredentialMetadata,
  setOpenId4VcCredentialMetadata,
  storeCredential,
} from '@package/agent'
import { getCreateJwtCallbackForBPrime } from '@package/agent/src/invitation/handler'
import { kdf } from '@package/secure-store/kdf'
import { B_PRIME_SD_JWT_VC_OFFER } from '../use-cases/bdrPidIssuerOffers'
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
    iss: ReceivePidUseCaseFlow.CLIENT_ID,
    sub: ReceivePidUseCaseFlow.CLIENT_ID,
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
    iss: ReceivePidUseCaseFlow.CLIENT_ID,
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

  return `${jwtCompact}~${popJwtCompact}`
}

export class PidIssuerPinInvalidError extends Error {}
export class PidIssuerPinLockedError extends Error {}

export const requestSdJwtVcFromSeedCredential = async ({
  agent,
  authorizationRequestUri,
  pidPin,
  incorrectPin,
}: {
  agent: EasyPIDAppAgent
  authorizationRequestUri: string
  pidPin: string
  incorrectPin?: boolean
}) => {
  try {
    await agent.context.wallet.createKey({
      keyType: KeyType.P256,
      privateKey: TypedArrayEncoder.fromHex('ad38184e0d5d9af97b023b6421707dc079f7d66a185bfd4c589837e3cb69fbfc'),
    })
  } catch {}

  try {
    const issuer = 'https://demo.pid-issuer.bundesdruckerei.de/b1'
    const pinNonce = await fetchPidIssuerNonce(issuer)
    const resolvedCredentialOffer = await agent.modules.openId4VcHolder.resolveCredentialOffer(B_PRIME_SD_JWT_VC_OFFER)
    const pinDerivedEphKey = await deriveKeypairFromPin(agent.context, pidPin.split('').map(Number))

    const clientAttestation = await createMockedClientAttestationAndProofOfPossession(agent, {
      audience: issuer,
      nonce: pinNonce,
    })

    const seedCredential = (await seedCredentialStorage.get(agent))?.seedCredential

    const pinSignedNonce = await signPinNonceAndDeviceKeyWithPinDerivedEphPriv(agent, {
      pinNonce,
      pinDerivedEphKey,
    })
    const deviceKeySignedNonce = await signPinNonceAndPinDerivedEphPubWithDeviceKey({
      pinDerivedEphKey,
      pinNonce,
    })

    const tokenResponse = await agent.modules.openId4VcHolder.requestToken({
      resolvedCredentialOffer,
      // @ts-ignore
      dPopKeyJwk: P256Jwk.fromJson(deviceKeyPair.asJwk() as unknown as JwkJson),
      getCreateJwtCallback: getCreateJwtCallbackForBPrime,
      customBody: {
        grant_type: 'seed_credential',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-client-attestation',
        client_assertion: clientAttestation,
        seed_credential: seedCredential,
        pin_signed_nonce: pinSignedNonce,
        device_key_signed_nonce: deviceKeySignedNonce,
        client_id: ReceivePidUseCaseFlow.CLIENT_ID,
      },
    })

    const resolvedAuthorizationRequest =
      await agent.modules.openId4VcHolder.resolveSiopAuthorizationRequest(authorizationRequestUri)
    const payload =
      await resolvedAuthorizationRequest.authorizationRequest.authorizationRequest.requestObject?.getPayload()
    const rpEphPub = payload?.rp_eph_pub
    if (!rpEphPub) {
      throw new Error('rp_eph_pub not found in the payload of the authorization request')
    }

    const key = await agent.context.wallet.createKey({
      keyType: KeyType.P256,
    })

    const offeredCredentialToRequest = resolvedCredentialOffer.offeredCredentials.find((i) => i.id === 'pid-sd-jwt')

    if (!offeredCredentialToRequest) {
      throw new Error('Could not find an pid-sd-jwt')
    }

    const credentialAndNotifications = await agent.modules.openId4VcHolder.requestCredentials({
      resolvedCredentialOffer,
      credentialBindingResolver: async ({ keyType, supportsJwk }) => {
        if (!supportsJwk) {
          throw Error('Issuer does not support JWK')
        }

        if (keyType !== KeyType.P256) {
          throw new Error(`invalid key type used '${keyType}' and only ${KeyType.P256} is allowed.`)
        }

        return {
          method: 'jwk',
          jwk: getJwkFromKey(key),
        }
      },
      ...tokenResponse,
      // @ts-ignore
      additionalCredentialRequestPayloadClaims: {
        verifier_ka: rpEphPub.jwk,
      },
      clientId: ReceivePidUseCaseFlow.CLIENT_ID,
      getCreateJwtCallback: getCreateJwtCallbackForBPrime,
      // we do this because the credential is hmac'ed between the verifier and issuer, so the validation can be done with the `rp_eph_pub` and the issuer key from the cert, but it does not add a lot of value
      skipSdJwtVcValidation: true,
    })

    const [firstCredential] = credentialAndNotifications
    if (!firstCredential) throw new Error('Error retrieving credential.')

    let record: SdJwtVcRecord

    if ('compact' in firstCredential.credential) {
      record = new SdJwtVcRecord({
        compactSdJwtVc: firstCredential.credential.compact,
      })
    } else {
      throw new Error('Only sd-jwt-vc is allowed')
    }

    const openId4VcMetadata = extractOpenId4VcCredentialMetadata(offeredCredentialToRequest, {
      id: resolvedCredentialOffer.metadata.issuer,
      display: resolvedCredentialOffer.metadata.credentialIssuerMetadata.display,
    })

    setOpenId4VcCredentialMetadata(record, openId4VcMetadata)

    return record
  } catch (e) {
    if (e instanceof Error && e.message.includes('PIN invalid')) {
      throw new PidIssuerPinInvalidError()
    }
    if (e instanceof Error && e.message.includes('PIN locked')) {
      throw new PidIssuerPinLockedError()
    }
    throw e
  }
}

const getAge = (birthDate: Date) => {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const convertDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  const parsedDate = new Date(0)
  parsedDate.setFullYear(year)
  parsedDate.setMonth(month)
  parsedDate.setDate(day)
  const age = getAge(parsedDate)
  return {
    age_birth_year: year,
    age_in_years: age,
    age_equal_or_over: {
      '12': age >= 12,
      '14': age >= 14,
      '16': age >= 16,
      '18': age >= 18,
      '21': age >= 21,
      '65': age >= 65,
    },
  }
}

export const convertAndStorePidDataIntoFakeSdJwtVc = async (
  agent: EasyPIDAppAgent,
  pid_data: SeedCredentialPidData['pid_data'],
  openId4VcMetadata: OpenId4VcCredentialMetadata
) => {
  const date = convertDate(pid_data.birthdate as string)

  const payload = {
    vct: 'urn:eu.europa.ec.eudi:pid:1',
    issuing_country: 'DE',
    issuing_authority: 'DE',
    given_name: pid_data.given_name,
    family_name: pid_data.family_name,
    birth_family_name: pid_data.birth_family_name,
    birthdate: pid_data.birthdate,
    age_birth_year: date.age_birth_year,
    age_in_years: date.age_in_years,
    age_equal_or_over: date.age_equal_or_over,
    place_of_birth: pid_data.place_of_birth,
    address: pid_data.address,
    nationalities: [pid_data.nationality],
  }

  const key = await agent.context.wallet.createKey({
    keyType: KeyType.P256,
  })
  const cert = await agent.x509.createSelfSignedCertificate({
    key,
    extensions: [[{ type: 'url', value: 'https://demo.pid-issuer.bundesdruckerei.de/b1' }]],
  })
  const sdJwtVc = await agent.sdJwtVc.sign({
    payload,
    issuer: {
      issuer: 'https://demo.pid-issuer.bundesdruckerei.de/b1',
      x5c: [cert.toString('base64')],
      method: 'x5c',
    },
    holder: { method: 'jwk', jwk: getJwkFromKey(key) },
    disclosureFrame: {
      _sd: [
        'family_name',
        'given_name',
        'birthdate',
        'age_birth_year',
        'age_in_years',
        'birth_family_name',
        // TODO: each item separately or disclosed as a whole?
        'nationalities',
      ],
      age_equal_or_over: {
        _sd: ['12', '14', '16', '18', '21', '65'],
      },
      place_of_birth: {
        _sd: ['locality'],
      },
      address: {
        _sd: ['locality', 'postal_code', 'street_address', 'country'],
      },
    },
  })

  const record = await agent.sdJwtVc.store(sdJwtVc.compact)
  const sdJwtVcRecord = new SdJwtVcRecord({
    compactSdJwtVc: sdJwtVc.compact,
  })
  setOpenId4VcCredentialMetadata(record, openId4VcMetadata)
  await storeCredential(agent, sdJwtVcRecord)
}
