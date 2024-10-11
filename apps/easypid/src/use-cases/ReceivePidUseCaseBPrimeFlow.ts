import { type JwkJson, Key, KeyType, P256Jwk, TypedArrayEncoder } from '@credo-ts/core'
import { pidSchemes } from '@easypid/constants'
import {
  convertAndStorePidDataIntoFakeSdJwtVc,
  createMockedClientAttestationAndProofOfPossession,
  deriveKeypairFromPin,
  requestToPidProvider,
} from '@easypid/crypto/bPrime'
import {
  BiometricAuthenticationError,
  acquireAccessToken,
  receiveCredentialFromOpenId4VciOfferAuthenticatedChannel,
  resolveOpenId4VciOffer,
} from '@package/agent'
import { seedCredentialStorage } from '../storage'
import { deviceKeyPair } from '../storage/pidPin'
import { ReceivePidUseCaseFlow, type ReceivePidUseCaseFlowOptions } from './ReceivePidUseCaseFlow'
import { B_PRIME_SD_JWT_VC_OFFER } from './bdrPidIssuerOffers'

export interface ReceivePidUseCaseBPrimeOptions extends ReceivePidUseCaseFlowOptions {
  pidPin: Array<number>
}

export class PinPossiblyReusedError extends Error {}

export class ReceivePidUseCaseBPrimeFlow extends ReceivePidUseCaseFlow<ReceivePidUseCaseBPrimeOptions> {
  private static REDIRECT_URI = 'https://funke.animo.id/redirect'

  static async initialize(options: ReceivePidUseCaseBPrimeOptions) {
    const headers = {
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-client-attestation',
      client_assertion: await createMockedClientAttestationAndProofOfPossession(options.agent, {
        audience: 'https://demo.pid-issuer.bundesdruckerei.de/b1',
      }),
    }
    const resolved = await resolveOpenId4VciOffer({
      agent: options.agent,
      offer: { uri: B_PRIME_SD_JWT_VC_OFFER },
      authorization: {
        clientId: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
        redirectUri: ReceivePidUseCaseBPrimeFlow.REDIRECT_URI,
      },
      customHeaders: headers,
    })

    if (!resolved.resolvedAuthorizationRequest) {
      throw new Error('Expected authorization_code grant, but not found')
    }

    const authFlow = new ReceivePidUseCaseBPrimeFlow(
      options,
      resolved.resolvedAuthorizationRequest,
      resolved.resolvedCredentialOffer
    )
    authFlow.startAuthFlow()
    const accessRights = await authFlow.accessRights
    authFlow.options.onStateChange?.('id-card-auth')
    return { authFlow, accessRights }
  }

  public async retrieveCredentials() {
    try {
      this.assertState({ expectedState: 'retrieve-credential' })

      if (!this.accessToken) {
        throw new Error('Expected accessToken be defined in state retrieve-credential')
      }

      const deviceKeyPublicKeyBytes = deviceKeyPair.publicKey()
      const deviceKey = Key.fromPublicKey(deviceKeyPublicKeyBytes, KeyType.P256)
      const credentialConfigurationIdToRequest = this.resolvedCredentialOffer.offeredCredentials[0].id
      const { credential, openId4VcMetadata } = await receiveCredentialFromOpenId4VciOfferAuthenticatedChannel({
        deviceKey,
        agent: this.options.agent,
        accessToken: this.accessToken,
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        credentialConfigurationIdToRequest,
        clientId: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
        pidSchemes,
      })

      await seedCredentialStorage.store(this.options.agent, { seedCredential: credential })

      const payload = credential.split('.')[1]
      const { pid_data } = JSON.parse(TypedArrayEncoder.fromBase64(payload).toString())
      const sdJwtVc = await convertAndStorePidDataIntoFakeSdJwtVc(this.options.agent, pid_data, openId4VcMetadata)

      return [sdJwtVc]
    } catch (error) {
      // We can recover from this error, so we shouldn't set the state to error
      if (error instanceof BiometricAuthenticationError) {
        throw error
      }

      this.handleError(error)
      throw error
    }
  }

  public async acquireAccessToken() {
    this.assertState({ expectedState: 'acquire-access-token' })

    try {
      if (!this.refreshUrl) {
        throw new Error('Expected refreshUrl be defined in state acquire-access-token')
      }

      const authorizationCodeResponse = await fetch(this.refreshUrl)
      if (!authorizationCodeResponse.ok) {
        this.handleError(`Auth code response has invalid status. ${authorizationCodeResponse.status}`)
        return
      }

      const { pin_nonce: pinNonce } = await authorizationCodeResponse.json()

      const pinDerivedEph = await deriveKeypairFromPin(this.options.agent.context, this.options.pidPin)

      const code = await requestToPidProvider(
        authorizationCodeResponse.url,
        this.options.agent,
        pinDerivedEph,
        pinNonce
      )

      this.accessToken = await acquireAccessToken({
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        resolvedAuthorizationRequest: {
          ...this.resolvedAuthorizationRequest,
          code,
        },
        agent: this.options.agent,
        dPopKeyJwk: P256Jwk.fromJson(deviceKeyPair.asJwk() as unknown as JwkJson),
      })

      this.assertState({
        expectedState: 'acquire-access-token',
        newState: 'retrieve-credential',
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Internal server error')) {
          const pinPossiblyReusedError = new PinPossiblyReusedError('PIN is possibly reused')
          this.handleError(pinPossiblyReusedError)
          throw pinPossiblyReusedError
        }
      }

      this.handleError(error)
      throw error
    }
  }
}
