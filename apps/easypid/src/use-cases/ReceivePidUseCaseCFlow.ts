import { AusweisAuthFlow, type AusweisAuthFlowOptions } from '@animo-id/expo-ausweis-sdk'
import type { AppAgent } from '@easypid/agent'
import { pidSchemes } from '@easypid/constants'
import {
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedAuthorizationRequest,
  type OpenId4VciResolvedCredentialOffer,
  acquireAccessToken,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
} from '@package/agent'

export interface ReceivePidUseCaseCFlowOptions
  extends Pick<
    AusweisAuthFlowOptions,
    'onAttachCard' | 'onRequestAccessRights' | 'onStatusProgress' | 'onCardAttachedChanged'
  > {
  agent: AppAgent
  onStateChange?: (newState: ReceivePidUseCaseState) => void
  onEnterPin: (
    options: Parameters<AusweisAuthFlowOptions['onEnterPin']>[0] & {
      currentSessionPinAttempts: number
    }
  ) => string | Promise<string>
}

export type ReceivePidUseCaseState = 'id-card-auth' | 'acquire-access-token' | 'retrieve-credential' | 'error'

export type CardScanningErrorDetails = Parameters<AusweisAuthFlowOptions['onError']>[0]

export class ReceivePidUseCaseCFlow {
  private options: ReceivePidUseCaseCFlowOptions

  private resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  private resolvedAuthorizationRequest: OpenId4VciResolvedAuthorizationRequest
  private idCardAuthFlow: AusweisAuthFlow
  private accessToken?: OpenId4VciRequestTokenResponse
  private refreshUrl?: string
  private currentSessionPinAttempts = 0

  private currentState: ReceivePidUseCaseState = 'id-card-auth'
  public get state() {
    return this.currentState
  }

  private static SD_JWT_VC_OFFER =
    'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fdemo.pid-issuer.bundesdruckerei.de%2Fc%22%2C%22credential_configuration_ids%22%3A%5B%22pid-sd-jwt%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%7D%7D%7D'
  private static MDL_OFFER =
    'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fdemo.pid-issuer.bundesdruckerei.de%2Fc%22%2C%22credential_configuration_ids%22%3A%5B%22pid-mso-mdoc%22%5D%2C%22grants%22%3A%7B%22authorization_code%22%3A%7B%7D%7D%7D'
  private static CLIENT_ID = '7598ca4c-cc2e-4ff1-a4b4-ed58f249e274'
  private static REDIRECT_URI = 'https://funke.animo.id/redirect'

  private errorCallbacks: AusweisAuthFlowOptions['onError'][] = [(e) => this.handleError(e)]
  private successCallbacks: AusweisAuthFlowOptions['onSuccess'][] = [
    ({ refreshUrl }) => {
      this.refreshUrl = refreshUrl
      this.assertState({
        expectedState: 'id-card-auth',
        newState: 'acquire-access-token',
      })
    },
  ]

  private constructor(
    options: ReceivePidUseCaseCFlowOptions,
    resolvedAuthorizationRequest: OpenId4VciResolvedAuthorizationRequest,
    resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  ) {
    this.resolvedAuthorizationRequest = resolvedAuthorizationRequest
    this.resolvedCredentialOffer = resolvedCredentialOffer
    this.options = options

    this.idCardAuthFlow = new AusweisAuthFlow({
      onEnterPin: async (options) => {
        const pin = await this.options.onEnterPin({
          ...options,
          currentSessionPinAttempts: this.currentSessionPinAttempts,
        })
        this.currentSessionPinAttempts += 1
        return pin
      },
      onError: (error) => {
        for (const errorCallback of this.errorCallbacks) {
          errorCallback(error)
        }
      },
      onSuccess: ({ refreshUrl }) => {
        for (const successCallback of this.successCallbacks) {
          successCallback({ refreshUrl })
        }
      },
      onCardAttachedChanged: (options) => this.options.onCardAttachedChanged?.(options),
      debug: __DEV__,
      onStatusProgress: (options) => this.options.onStatusProgress?.(options),
      onAttachCard: () => this.options.onAttachCard?.(),
    })
    this.options.onStateChange?.('id-card-auth')
  }

  public static async initialize(options: ReceivePidUseCaseCFlowOptions) {
    const resolved = await resolveOpenId4VciOffer({
      agent: options.agent,
      offer: { uri: ReceivePidUseCaseCFlow.SD_JWT_VC_OFFER },
      authorization: {
        clientId: ReceivePidUseCaseCFlow.CLIENT_ID,
        redirectUri: ReceivePidUseCaseCFlow.REDIRECT_URI,
      },
    })

    if (!resolved.resolvedAuthorizationRequest) {
      throw new Error('Expected authorization_code grant, but not found')
    }

    return new ReceivePidUseCaseCFlow(options, resolved.resolvedAuthorizationRequest, resolved.resolvedCredentialOffer)
  }

  public async cancelIdCardScanning() {
    if (this.currentState !== 'id-card-auth' || !this.idCardAuthFlow.isActive) {
      return
    }

    await this.idCardAuthFlow.cancel()
  }

  public authenticateUsingIdCard() {
    if (this.idCardAuthFlow.isActive) {
      throw new Error('authentication flow already active')
    }

    if (this.currentState !== 'id-card-auth') {
      throw new Error(`Current state is ${this.currentState}. Expected id-card-auth`)
    }

    this.currentSessionPinAttempts = 0

    // We return an authentication promise to make it easier to track the state
    // We remove the callbacks once the error or success is triggered.
    const authenticationPromise = new Promise((resolve, reject) => {
      const successCallback: AusweisAuthFlowOptions['onSuccess'] = () => {
        this.errorCallbacks = this.errorCallbacks.filter((c) => c === errorCallback)
        this.successCallbacks = this.successCallbacks.filter((c) => c === successCallback)
        resolve(null)
      }
      const errorCallback: AusweisAuthFlowOptions['onError'] = (error) => {
        this.errorCallbacks = this.errorCallbacks.filter((c) => c === errorCallback)
        this.successCallbacks = this.successCallbacks.filter((c) => c === successCallback)
        reject(error)
      }

      this.successCallbacks.push(successCallback)
      this.errorCallbacks.push(errorCallback)

      this.idCardAuthFlow.start({
        tcTokenUrl: this.resolvedAuthorizationRequest.authorizationRequestUri,
      })
    })

    return authenticationPromise
  }

  public async retrieveCredential() {
    try {
      this.assertState({ expectedState: 'retrieve-credential' })

      if (!this.accessToken) {
        throw new Error('Expected accessToken be defined in state retrieve-credential')
      }

      const credentialConfigurationIdToRequest = this.resolvedCredentialOffer.offeredCredentials[0].id
      const credentialRecord = await receiveCredentialFromOpenId4VciOffer({
        agent: this.options.agent,
        accessToken: this.accessToken,
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        credentialConfigurationIdToRequest,
        clientId: ReceivePidUseCaseCFlow.CLIENT_ID,
        pidSchemes,
      })

      // TODO: add error handling everywhere to set state to error
      if (credentialRecord.type !== 'SdJwtVcRecord') {
        throw new Error('Unexpected record type')
      }

      return credentialRecord
    } catch (error) {
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
        this.handleError('Did not receive valid response for authorization code redirect')
        return
      }

      const authorizationCode = new URL(authorizationCodeResponse.url).searchParams.get('code')

      if (!authorizationCode) {
        this.handleError('Missing authorization code')
        return
      }

      this.accessToken = await acquireAccessToken({
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        resolvedAuthorizationRequest: {
          ...this.resolvedAuthorizationRequest,
          code: authorizationCode,
        },
        agent: this.options.agent,
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

  private assertState({
    expectedState,
    newState,
  }: {
    expectedState: ReceivePidUseCaseCFlow['currentState']
    newState?: ReceivePidUseCaseCFlow['currentState']
  }) {
    if (this.currentState !== expectedState) {
      throw new Error(`Expected state to be ${expectedState}. Found ${this.currentState}`)
    }

    if (newState) {
      this.currentState = newState
      this.options.onStateChange?.(newState)
    }
  }

  private handleError(error: unknown) {
    this.currentState = 'error'
    console.error(error)

    this.options.onStateChange?.('error')
  }
}
