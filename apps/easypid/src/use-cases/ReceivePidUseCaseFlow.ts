import {
  AusweisAuthFlow,
  type AusweisAuthFlowOptions,
  addMessageListener,
  initializeSdk,
  sendCommand,
} from '@animo-id/expo-ausweis-sdk'
import type { MdocRecord } from '@credo-ts/core'
import type { AppAgent } from '@easypid/agent'
import type {
  OpenId4VciRequestTokenResponse,
  OpenId4VciResolvedCredentialOffer,
  OpenId4VciResolvedOauth2RedirectAuthorizationRequest,
  SdJwtVcRecord,
} from '@package/agent'
import { acquireAuthorizationCodeAccessToken } from '@package/agent/invitation/handler'

export interface ReceivePidUseCaseFlowOptions
  extends Pick<AusweisAuthFlowOptions, 'onAttachCard' | 'onStatusProgress' | 'onCardAttachedChanged'> {
  agent: AppAgent
  onStateChange?: (newState: ReceivePidUseCaseState) => void
  onEnterPin: (
    options: Parameters<AusweisAuthFlowOptions['onEnterPin']>[0] & {
      currentSessionPinAttempts: number
    }
  ) => string | Promise<string>
  allowSimulatorCard?: boolean
}

export type ReceivePidUseCaseState = 'id-card-auth' | 'acquire-access-token' | 'retrieve-credential' | 'error'

export type CardScanningErrorDetails = Parameters<AusweisAuthFlowOptions['onError']>[0]

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export abstract class ReceivePidUseCaseFlow<ExtraOptions = {}> {
  protected options: ReceivePidUseCaseFlowOptions & ExtraOptions

  public resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  protected resolvedAuthorizationRequest: OpenId4VciResolvedOauth2RedirectAuthorizationRequest
  protected idCardAuthFlow!: AusweisAuthFlow
  protected accessToken?: OpenId4VciRequestTokenResponse
  protected refreshUrl?: string
  protected currentSessionPinAttempts = 0
  protected authenticationPromise?: Promise<void>
  protected accessRights: Promise<string[]>

  static REDIRECT_URI = 'https://funke.animo.id/redirect'
  static CLIENT_ID = '7598ca4c-cc2e-4ff1-a4b4-ed58f249e274'

  protected currentState: ReceivePidUseCaseState = 'id-card-auth'
  public get state() {
    return this.currentState
  }

  protected errorCallbacks: AusweisAuthFlowOptions['onError'][] = [(e) => this.handleError(e)]
  protected successCallbacks: AusweisAuthFlowOptions['onSuccess'][] = [
    ({ refreshUrl }) => {
      this.refreshUrl = refreshUrl
      this.assertState({
        expectedState: 'id-card-auth',
        newState: 'acquire-access-token',
      })
    },
  ]

  public abstract retrieveCredentials(): Promise<Array<SdJwtVcRecord | MdocRecord>>

  protected constructor(
    options: ReceivePidUseCaseFlowOptions & ExtraOptions,
    resolvedAuthorizationRequest: OpenId4VciResolvedOauth2RedirectAuthorizationRequest,
    resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  ) {
    this.resolvedAuthorizationRequest = resolvedAuthorizationRequest
    this.resolvedCredentialOffer = resolvedCredentialOffer
    this.options = options

    this.accessRights = new Promise((resolve) => {
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
        allowSimulatorCard: options.allowSimulatorCard,
        debug: __DEV__,
        onStatusProgress: (options) => this.options.onStatusProgress?.(options),
        onAttachCard: () => this.options.onAttachCard?.(),
        onRequestAccessRights: (options) => {
          resolve(options.effective)
          // FIXME: this is a bit hacky, we never resolve this one, as we manually call `ACCEPT_ACCESS_RIGHTS`
          return new Promise(() => {})
        },
      })
    })
  }

  public async cancelIdCardScanning() {
    if (this.currentState !== 'id-card-auth' || !this.idCardAuthFlow.isActive) {
      return
    }

    await this.idCardAuthFlow.cancel()
  }

  public authenticateUsingIdCard() {
    this.currentSessionPinAttempts = 0

    if (!this.idCardAuthFlow.isActive || !this.authenticationPromise) {
      throw new Error('authentication flow not active')
    }

    if (this.currentState !== 'id-card-auth') {
      throw new Error(`Current state is ${this.currentState}. Expected id-card-auth`)
    }

    sendCommand({ cmd: 'ACCEPT' })
    return this.authenticationPromise
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

      this.accessToken = await acquireAuthorizationCodeAccessToken({
        resolvedCredentialOffer: this.resolvedCredentialOffer,
        authorizationCode,
        codeVerifier: this.resolvedAuthorizationRequest.codeVerifier,
        clientId: ReceivePidUseCaseFlow.CLIENT_ID,
        redirectUri: ReceivePidUseCaseFlow.REDIRECT_URI,
        agent: this.options.agent,
        dPopKeyJwk: this.resolvedAuthorizationRequest.dpop?.jwk,
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

  /**
   * We always try to gracefully shut the auth flow down
   * but somtimes due to an error it may not be the case
   * we make sure to always clean running auth flow before we
   * start a new one
   */
  private async cancelPotentiallyAbandonedAuthFlow() {
    await initializeSdk()

    const cancelPromise = new Promise((resolve, reject) => {
      let hasCancelled = false
      const subscription = addMessageListener((message) => {
        // Auth flow is now cancelled
        if (message.msg === 'AUTH' && message.result?.reason === 'User_Cancelled') {
          subscription.remove()
          resolve(undefined)
          return
        }

        if (message.msg === 'STATUS' && !hasCancelled) {
          // Auth flow is active, we need to cancel
          if (message.workflow === 'AUTH') {
            hasCancelled = true
            sendCommand({ cmd: 'CANCEL' })
            return
          }

          // Auth flow is not active, no need to cancel
          subscription.remove()
          resolve(undefined)
          return
        }
      })

      sendCommand({ cmd: 'GET_STATUS' })
    })

    return cancelPromise
  }

  protected async startAuthFlow() {
    if (this.idCardAuthFlow.isActive) {
      throw new Error('authentication flow already active')
    }

    try {
      await this.cancelPotentiallyAbandonedAuthFlow()
    } catch (error) {
      return
    }

    // We return an authentication promise to make it easier to track the state
    // We remove the callbacks once the error or success is triggered.
    const authenticationPromise = new Promise<void>((resolve, reject) => {
      const successCallback: AusweisAuthFlowOptions['onSuccess'] = () => {
        this.errorCallbacks = this.errorCallbacks.filter((c) => c === errorCallback)
        this.successCallbacks = this.successCallbacks.filter((c) => c === successCallback)
        resolve()
      }
      const errorCallback: AusweisAuthFlowOptions['onError'] = (error) => {
        this.errorCallbacks = this.errorCallbacks.filter((c) => c === errorCallback)
        this.successCallbacks = this.successCallbacks.filter((c) => c === successCallback)
        reject(error)
      }

      this.successCallbacks.push(successCallback)
      this.errorCallbacks.push(errorCallback)

      this.idCardAuthFlow.start({
        tcTokenUrl: this.resolvedAuthorizationRequest.authorizationRequestUrl,
      })
    })

    this.authenticationPromise = authenticationPromise
    return authenticationPromise
  }

  protected assertState({
    expectedState,
    newState,
  }: {
    expectedState: ReceivePidUseCaseState
    newState?: ReceivePidUseCaseState
  }) {
    if (this.currentState !== expectedState) {
      throw new Error(`Expected state to be ${expectedState}. Found ${this.currentState}`)
    }

    if (newState) {
      this.currentState = newState
      this.options.onStateChange?.(newState)
    }
  }

  protected handleError(error: unknown) {
    this.currentState = 'error'
    console.error(error)
    this.options.onStateChange?.('error')
  }
}
