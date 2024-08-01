import {
  type FullAppAgent,
  receiveCredentialFromOpenId4VciOffer,
  acquireAccessToken,
  resolveOpenId4VciOffer,
  type OpenId4VciResolvedCredentialOffer,
  type OpenId4VciResolvedAuthorizationRequest,
  type OpenId4VciRequestTokenResponse,
} from '@package/agent'
import { AusweisAuthFlow } from '@animo-id/expo-ausweis-sdk'

export interface ReceivePidUseCaseOptions {
  agent: FullAppAgent
  onStateChange?: (newState: ReceivePidUseCaseState) => void
}

export type ReceivePidUseCaseState = 'id-card-auth' | 'acquire-access-token' | 'retrieve-credential' | 'error'

export class ReceivePidUseCase {
  private agent: FullAppAgent

  private resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  private resolvedAuthorizationRequest: OpenId4VciResolvedAuthorizationRequest
  private idCardAuthFlow: AusweisAuthFlow
  private accessToken?: OpenId4VciRequestTokenResponse

  private onStateChange?: (newState: ReceivePidUseCaseState) => void
  private currentState: ReceivePidUseCaseState = 'id-card-auth'
  public get state() {
    return this.currentState
  }

  private static SD_JWT_VC_OFFER =
    'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fdemo.pid-issuer.bundesdruckerei.de%2Fc%22%2C%22credential_configuration_ids%22%3A%5B%22pid-sd-jwt%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%7D%7D%7D'
  private static CLIENT_ID = '7598ca4c-cc2e-4ff1-a4b4-ed58f249e274'
  private static REDIRECT_URI = 'https://funke.animo.id/redirect'

  private constructor(
    agent: FullAppAgent,
    resolvedAuthorizationRequest: OpenId4VciResolvedAuthorizationRequest,
    resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer,
    onStateChange?: (newState: ReceivePidUseCaseState) => void
  ) {
    this.agent = agent
    this.resolvedAuthorizationRequest = resolvedAuthorizationRequest
    this.resolvedCredentialOffer = resolvedCredentialOffer
    this.onStateChange = onStateChange

    this.idCardAuthFlow = new AusweisAuthFlow({
      onEnterPin: () => {
        return '123456'
      },
      onError: (e) => {
        this.handleError()
      },
      onSuccess: async ({ refreshUrl }) => {
        await this.acquireAccessToken(refreshUrl)
      },
      onInsertCard: () => {
        // TODO: ui trigger
      },
    })
    this.onStateChange?.('id-card-auth')
  }

  public static async initialize({ agent, onStateChange }: ReceivePidUseCaseOptions) {
    const resolved = await resolveOpenId4VciOffer({
      agent,
      offer: { uri: ReceivePidUseCase.SD_JWT_VC_OFFER },
      authorization: {
        clientId: ReceivePidUseCase.CLIENT_ID,
        redirectUri: ReceivePidUseCase.REDIRECT_URI,
      },
    })

    if (!resolved.resolvedAuthorizationRequest) {
      throw new Error('Expected authorization_code grant, but not found')
    }

    return new ReceivePidUseCase(
      agent,
      resolved.resolvedAuthorizationRequest,
      resolved.resolvedCredentialOffer,
      onStateChange
    )
  }

  public async authenticateUsingIdCard() {
    if (this.idCardAuthFlow.isActive) {
      throw new Error('authentication flow already active')
    }

    if (this.currentState !== 'id-card-auth') {
      throw new Error(`Current state is ${this.currentState}. Expected id-card-auth`)
    }

    this.idCardAuthFlow.start({
      tcTokenUrl: this.resolvedAuthorizationRequest.authorizationRequestUri,
    })
  }

  public async retrieveCredential() {
    try {
      this.assertState({ expectedState: 'retrieve-credential' })

      if (!this.accessToken) {
        throw new Error('Expected accessToken be defined in state retrieve-credential')
      }

      const credentialConfigurationIdToRequest = this.resolvedCredentialOffer.offeredCredentials[0].id
      const credentialRecord = await receiveCredentialFromOpenId4VciOffer({
        agent: this.agent,
        accessToken: this.accessToken,
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        credentialConfigurationIdToRequest,
        clientId: ReceivePidUseCase.CLIENT_ID,
      })

      // TODO: add error handling everywhere to set state to error
      if (credentialRecord.type !== 'SdJwtVcRecord') {
        throw new Error('Unexpected record type')
      }

      return credentialRecord
    } catch (error) {
      this.handleError()
      throw error
    }
  }

  private async acquireAccessToken(refreshUrl: string) {
    this.assertState({ expectedState: 'id-card-auth', newState: 'acquire-access-token' })

    try {
      const authorizationCodeResponse = await fetch(refreshUrl)
      if (!authorizationCodeResponse.ok) {
        this.handleError()
        return
      }

      const authorizationCode = new URL(authorizationCodeResponse.url).searchParams.get('code')

      if (!authorizationCode) {
        this.handleError()
        return
      }

      this.accessToken = await acquireAccessToken({
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        resolvedAuthorizationRequest: {
          ...this.resolvedAuthorizationRequest,
          code: authorizationCode,
        },
        agent: this.agent,
      })

      this.assertState({ expectedState: 'acquire-access-token', newState: 'retrieve-credential' })
    } catch (error) {
      this.handleError()
    }
  }

  private assertState({
    expectedState,
    newState,
  }: { expectedState: ReceivePidUseCase['currentState']; newState?: ReceivePidUseCase['currentState'] }) {
    if (this.currentState !== expectedState) {
      throw new Error(`Expected state to be ${expectedState}. Found ${this.currentState}`)
    }

    if (newState) {
      this.currentState = newState
      this.onStateChange?.(newState)
    }
  }

  private handleError() {
    this.currentState = 'error'
    this.onStateChange?.('error')
  }
}
