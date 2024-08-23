import { Key, KeyType } from '@credo-ts/core'
import { pidSchemes } from '@easypid/constants'
import { createPinDerivedEphKeyPop, deriveKeypairFromPin } from '@easypid/crypto/bPrime'
import { BiometricAuthenticationError, type FullAppAgent, resolveOpenId4VciOffer } from '@package/agent'
import { receiveCredentialFromOpenId4VciOfferAuthenticatedChannel } from '@package/agent'
import { ReceivePidUseCaseFlow, type ReceivePidUseCaseFlowOptions } from './ReceivePidUseCaseFlow'

export interface ReceivePidUseCaseBPrimeOptions extends ReceivePidUseCaseFlowOptions {
  pidPin: Array<number>
}

export class ReceivePidUseCaseBPrimeFlow extends ReceivePidUseCaseFlow<ReceivePidUseCaseBPrimeOptions> {
  private static SD_JWT_VC_OFFER =
    'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fdemo.pid-issuer.bundesdruckerei.de%2Fb1%22%2C%22credential_configuration_ids%22%3A%5B%22pid-sd-jwt%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%7D%7D%7D'
  private static MDL_OFFER =
    'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fdemo.pid-issuer.bundesdruckerei.de%2Fc%22%2C%22credential_configuration_ids%22%3A%5B%22pid-mso-mdoc%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%7D%7D%7D'
  private static CLIENT_ID = '7598ca4c-cc2e-4ff1-a4b4-ed58f249e274'
  private static REDIRECT_URI = 'https://funke.animo.id/redirect'

  static async initialize(options: ReceivePidUseCaseBPrimeOptions) {
    const resolved = await resolveOpenId4VciOffer({
      agent: options.agent,
      offer: { uri: ReceivePidUseCaseBPrimeFlow.SD_JWT_VC_OFFER },
      authorization: {
        clientId: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
        redirectUri: ReceivePidUseCaseBPrimeFlow.REDIRECT_URI,
      },
    })

    if (!resolved.resolvedAuthorizationRequest) {
      throw new Error('Expected authorization_code grant, but not found')
    }

    return new ReceivePidUseCaseBPrimeFlow(
      options,
      resolved.resolvedAuthorizationRequest,
      resolved.resolvedCredentialOffer
    )
  }

  public async retrieveCredential() {
    try {
      this.assertState({ expectedState: 'retrieve-credential' })

      if (!this.accessToken) {
        throw new Error('Expected accessToken be defined in state retrieve-credential')
      }

      // TODO: get the device key
      const deviceKey = Key.fromPublicKey(new Uint8Array(), KeyType.P256)

      const pinDerivedEph = await deriveKeypairFromPin(this.options.agent.context, this.options.pidPin)

      // TODO: how do we get the audience?
      const pinDerivedEphKeyPop = await createPinDerivedEphKeyPop(this.options.agent as unknown as FullAppAgent, {
        aud: 'a',
        pinDerivedEph,
        deviceKey,
        cNonce: 'a',
      })

      const credentialConfigurationIdToRequest = this.resolvedCredentialOffer.offeredCredentials[0].id
      const credentialRecord = await receiveCredentialFromOpenId4VciOfferAuthenticatedChannel({
        pinDerivedEphKeyPop,
        pinDerivedEph,
        deviceKey,
        agent: this.options.agent,
        accessToken: this.accessToken,
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        credentialConfigurationIdToRequest,
        clientId: ReceivePidUseCaseBPrimeFlow.CLIENT_ID,
        pidSchemes,
      })

      // TODO: add error handling everywhere to set state to error
      if (credentialRecord.type !== 'SdJwtVcRecord') {
        throw new Error('Unexpected record type')
      }

      return credentialRecord
    } catch (error) {
      // We can recover from this error, so we shouldn't set the state to error
      if (error instanceof BiometricAuthenticationError) {
        throw error
      }

      this.handleError(error)
      throw error
    }
  }
}
