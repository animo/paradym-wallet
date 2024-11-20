import type { SecureEnvironment } from '@animo-id/expo-secure-environment'
import {
  type AgentContext,
  type JwsProtectedHeaderOptions,
  JwsService,
  JwtPayload,
  getJwkFromKey,
} from '@credo-ts/core'
import type { EasyPIDAppAgent } from 'packages/agent/src'
import { deriveKeypairFromPin } from './pin'
import { getOrCreateSalt } from './salt'

let __pin: Array<number> | undefined
export const setWalletServiceProviderPin = (pin?: Array<number>) => {
  __pin = pin
}
export const getWalletServiceProviderPin = () => __pin

export class WalletServiceProviderClient implements SecureEnvironment {
  private headers: Headers = new Headers({
    'Content-Type': 'application/json',
  })

  public constructor(
    private hsmUrl: string,
    private agent: EasyPIDAppAgent
  ) {}

  public async register() {
    await this.post('register-wallet', {})
  }

  private async post<T>(path: string, claims: Record<string, unknown>): Promise<T> {
    const pin = getWalletServiceProviderPin()
    if (!pin)
      throw new Error(
        'Pin not set! call `setWalletServiceProviderPin(pin)` before calling a method on the WalletServiceProvider'
      )
    const jwsService = this.agent.context.dependencyManager.resolve(JwsService)
    const salt = await getOrCreateSalt(this.agent)
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
    return parsedData
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

  public async generateKeypair(id: string): Promise<void> {
    await this.post('create-key', { keyType: 'P256', keyId: id })
  }

  public async getPublicBytesForKeyId(keyId: string): Promise<Uint8Array> {
    const { publicKey } = await this.post<{ publicKey: Array<number> }>('get-publickey', { keyId })
    if (!publicKey) {
      throw new Error('No publicKey property found on the response of the wallet service provider')
    }

    return new Uint8Array(publicKey)
  }
}
