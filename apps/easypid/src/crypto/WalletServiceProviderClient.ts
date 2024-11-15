import type { SecureEnvironment } from '@animo-id/expo-secure-environment'

export class WalletServiceProviderClient implements SecureEnvironment {
  private headers: Headers = new Headers({
    authorization: `Bearer ${this.authToken}`,
    'Content-Type': 'application/json',
  })

  public constructor(
    private authToken: string,
    private hsmUrl: string
  ) {}

  public async sign(keyId: string, message: Uint8Array): Promise<Uint8Array> {
    const response = await fetch(`${this.hsmUrl}/sign`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ data: new Array(...message), keyId }),
    })
    const parsedData = (await response.json()) as { signature: Array<number> }

    if (!parsedData.signature) {
      throw new Error('No signature property found on the response of the wallet service provider')
    }

    return new Uint8Array(parsedData.signature)
  }

  public async generateKeypair(id: string): Promise<void> {
    const response = await fetch(`${this.hsmUrl}/create-key`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ keyType: 'P256', keyId: id }),
    })
    await response.text()
  }

  public async getPublicBytesForKeyId(keyId: string): Promise<Uint8Array> {
    const response = await fetch(`${this.hsmUrl}/get-publickey`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ keyId }),
    })
    const parsedData = (await response.json()) as { publicKey: Array<number> }

    if (!parsedData.publicKey) {
      throw new Error('No publicKey property found on the response of the wallet service provider')
    }

    return new Uint8Array(parsedData.publicKey)
  }
}
