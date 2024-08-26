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

export interface ReceivePidUseCaseBPrimeOptions extends ReceivePidUseCaseFlowOptions {
  pidPin: Array<number>
}

export class ReceivePidUseCaseBPrimeFlow extends ReceivePidUseCaseFlow<ReceivePidUseCaseBPrimeOptions> {
  private static SD_JWT_VC_OFFER =
    'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fdemo.pid-issuer.bundesdruckerei.de%2Fb1%22%2C%22credential_configuration_ids%22%3A%5B%22pid-sd-jwt%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%7D%7D%7D'
  private static MDL_OFFER =
    'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fdemo.pid-issuer.bundesdruckerei.de%2Fc%22%2C%22credential_configuration_ids%22%3A%5B%22pid-mso-mdoc%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%7D%7D%7D'
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
      offer: { uri: ReceivePidUseCaseBPrimeFlow.SD_JWT_VC_OFFER },
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
      const credential = await receiveCredentialFromOpenId4VciOfferAuthenticatedChannel({
        deviceKey,
        agent: this.options.agent,
        accessToken: this.accessToken,
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        credentialConfigurationIdToRequest,
        clientId: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
        pidSchemes,
      })

      await seedCredentialStorage.store(this.options.agent, credential)

      const payload = credential.split('.')[1]
      const { pid_data } = JSON.parse(TypedArrayEncoder.fromBase64(payload).toString())
      await convertAndStorePidDataIntoFakeSdJwtVc(this.options.agent, pid_data)

      return [credential]
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
      this.handleError(error)
      throw error
    }
  }
}
