import type { SecureEnvironment } from '@animo-id/expo-secure-environment'
import { AskarModule } from '@credo-ts/askar'
import {
  Agent,
  CredoWebCrypto,
  type JwsProtectedHeaderOptions,
  JwsService,
  JwtPayload,
  KeyDerivationMethod,
  TypedArrayEncoder,
  WalletInvalidKeyError,
  getJwkFromKey,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { askar } from '@openwallet-foundation/askar-react-native'
import { secureWalletKey } from '@package/secure-store/secureUnlock'
import type { BaseAgent } from '@paradym/wallet-sdk/agent'
import { InvalidPinError } from './error'
import { deriveKeypairFromPin } from './pin'

// TODO: should auto reset after X seconds
let __pin: Array<number> | undefined
export const setWalletServiceProviderPin = async (pin: Array<number>, validatePin = true) => {
  const pinString = pin.join('')
  if (validatePin) {
    const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
    const walletKey = await secureWalletKey.getWalletKeyUsingPin(pinString, walletKeyVersion)
    const walletId = `easypid-wallet-${walletKeyVersion}`
    const agent = new Agent({
      config: {
        label: 'pin_test_agent',
        walletConfig: { id: walletId, key: walletKey, keyDerivationMethod: KeyDerivationMethod.Raw },
      },
      modules: {
        askar: new AskarModule({ askar }),
      },
      dependencies: agentDependencies,
    })

    try {
      await agent.initialize()
    } catch (e) {
      if (e instanceof WalletInvalidKeyError) {
        throw new InvalidPinError()
      }
      throw e
    }

    await agent.shutdown()
  }
  __pin = pin
}

export const getWalletServiceProviderPin = () => __pin

const GENERIC_RECORD_WALLET_SERVICE_PROVIDER_SALT_ID = 'GENERIC_RECORD_WALLET_SERVICE_PROVIDER_SALT_ID'

export class WalletServiceProviderClient implements SecureEnvironment {
  private headers: Headers = new Headers({
    'Content-Type': 'application/json',
  })

  public constructor(
    private hsmUrl: string,
    private agent: BaseAgent
  ) {}

  private async post<T>(path: string, claims: Record<string, unknown>): Promise<T> {
    const pin = getWalletServiceProviderPin()
    if (!pin)
      throw new Error(
        'Pin not set! call `setWalletServiceProviderPin(pin)` before calling a method on the WalletServiceProvider'
      )
    const jwsService = this.agent.context.dependencyManager.resolve(JwsService)
    const salt = await this.getOrCreateSalt()
    const key = await deriveKeypairFromPin(this.agent.context, pin, salt)

    const payload = new JwtPayload({
      additionalClaims: claims,
    })

    const protectedHeaderOptions: JwsProtectedHeaderOptions = {
      alg: 'ES256',
      jwk: getJwkFromKey(key),
    }

    const compactJws = await jwsService.createJwsCompact(this.agent.context, {
      key,
      payload,
      protectedHeaderOptions,
    })

    const body = {
      jwt: compactJws,
    }

    const response = await fetch(`${this.hsmUrl}/${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })

    const parsedData = await response.json()
    return parsedData as T
  }

  public async register() {
    await this.post('register-wallet', {})
  }

  public async batchGenerateKeyPair(keyIds: string[]): Promise<Record<string, Uint8Array>> {
    const { publicKeys } = await this.post<{ publicKeys: Record<string, Array<number>> }>('batch-create-key', {
      keyIds,
      keyType: 'P256',
    })

    return Object.entries(publicKeys).reduce(
      (prev, [keyId, publicKey]) => ({ ...prev, [keyId]: new Uint8Array(publicKey) }),
      {}
    )
  }

  public async sign(keyId: string, message: Uint8Array): Promise<Uint8Array> {
    const { signature } = await this.post<{ signature: Array<number> }>('sign', {
      data: new Array(...message),
      keyId,
    })

    if (!signature) {
      throw new Error('No signature property found on the response of the wallet service provider')
    }

    return new Uint8Array(signature)
  }

  public async generateKeypair(id: string): Promise<Uint8Array> {
    const { publicKey } = await this.post<{ publicKey: Array<number> }>('create-key', { keyType: 'P256', keyId: id })
    return new Uint8Array(publicKey)
  }

  public async getPublicBytesForKeyId(keyId: string): Promise<Uint8Array> {
    const { publicKey } = await this.post<{ publicKey: Array<number> }>('get-publickey', { keyId })
    if (!publicKey) {
      throw new Error('No publicKey property found on the response of the wallet service provider')
    }

    return new Uint8Array(publicKey)
  }

  public async createSalt() {
    const maybeSalt = await this.getSalt()
    if (maybeSalt) return maybeSalt

    const crypto = new CredoWebCrypto(this.agent.context)

    const saltBytes = crypto.getRandomValues(new Uint8Array(12))
    const saltString = TypedArrayEncoder.toBase64URL(saltBytes)
    await this.agent.genericRecords.save({
      content: { salt: saltString },
      id: GENERIC_RECORD_WALLET_SERVICE_PROVIDER_SALT_ID,
    })
    return saltString
  }

  private async getSalt(): Promise<string | null> {
    return (await this.agent.genericRecords.findById(GENERIC_RECORD_WALLET_SERVICE_PROVIDER_SALT_ID))?.content
      .salt as string
  }

  private async getOrCreateSalt() {
    const maybeSalt = await this.getSalt()
    return maybeSalt ?? (await this.createSalt())
  }
}
