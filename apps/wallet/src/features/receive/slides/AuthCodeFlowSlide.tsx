import { useDevelopmentMode } from '@app/hooks'
import { Trans, useLingui } from '@lingui/react/macro'
import { DualResponseButtons, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Heading, MiniCardRowItem, Paragraph, useToastController, YStack } from '@package/ui'
import type { CredentialDisplay } from '@paradym/wallet-sdk'
import { parseInvitationUrlSync, useParadym } from '@paradym/wallet-sdk'
import { useGlobalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { type AuthSessionResult, openAuthSessionAsync } from '../../../../modules/auth-tab'
import {
  handleIssuanceAuthorizationPresentationRequest,
  setIssuanceAuthorizationPresentationRequestHandler,
} from '../issuanceAuthorizationPresentationRequest'

function isOpenIdAuthorizationRequest(url: string) {
  try {
    return parseInvitationUrlSync(url).type === 'openid-authorization-request'
  } catch {
    return false
  }
}

export type AuthCodeFlowDetails = {
  domain: string
  redirectUri: string
  openUrl: string
}

interface AuthCodeFlowSlideProps {
  display: CredentialDisplay
  authCodeFlowDetails: AuthCodeFlowDetails
  onAuthFlowCallback: (authorizationCode: string) => void
  /**
   * Called with the OpenID4VP request the authorization server redirects to from the browser, to request
   * a presentation as part of the authorization. Continues to the next step once it resolves.
   */
  onPresentationRequest?: (requestUri: string) => Promise<void>
  onCancel: (errorMessage?: string) => void
  onError: (errorMessage?: string) => void
  // Open the browser when the slide shows, e.g. to continue an authorization after a presentation
  autoOpen?: boolean
}

export const AuthCodeFlowSlide = ({
  authCodeFlowDetails,
  onAuthFlowCallback,
  onPresentationRequest,
  onCancel,
  onError,
  display,
  autoOpen,
}: AuthCodeFlowSlideProps) => {
  const { paradym } = useParadym('unlocked')
  const toast = useToastController()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const { t } = useLingui()
  const { onNext, onCancel: wizardOnCancel, confirmCombined } = useWizard()
  const { credentialAuthorizationCode } = useGlobalSearchParams<{
    credentialAuthorizationCode?: string
  }>()
  const [browserResult, setBrowserResult] = useState<AuthSessionResult>()
  const [hasHandledResult, setHasHandledResult] = useState(false)
  const [isResolvingPresentationRequest, setIsResolvingPresentationRequest] = useState(false)
  // A ref, as the browser result can arrive before a re-render after the presentation request
  const hasReceivedPresentationRequest = useRef(false)

  useEffect(() => () => setIssuanceAuthorizationPresentationRequestHandler(undefined), [])

  useEffect(() => {
    if (hasHandledResult) return

    // NOTE: credentialAuthorizationCode is set in +native-intent
    // after an external browser or app redirects back to us. In some
    // cases the in-app browser is exited (e.g. when authenticating from
    // a native app) and thus we need to manually dismiss the auth session
    // and instead use the auth code from there.
    if (credentialAuthorizationCode) {
      // Not available on Android
      if (Platform.OS === 'ios') {
        WebBrowser.dismissAuthSession()
      }

      setHasHandledResult(true)
      onNext()
      onAuthFlowCallback(credentialAuthorizationCode)
    } else if (browserResult) {
      if (browserResult.type !== 'success') {
        paradym.logger.warn('Browser authorization failed. Browser result did not return a success status', {
          browserResult,
        })
        toast.show(t(commonMessages.authorizationFailed), {
          customData: {
            preset: 'warning',
          },
        })

        const developmentMessage = isDevelopmentModeEnabled
          ? `\n\nDevelopment mode error:\nBrowser result returned '${browserResult.type}' result.`
          : ''
        browserResult.type === 'cancel' || browserResult.type === 'dismiss'
          ? onCancel(t(commonMessages.authorizationCancelled) + developmentMessage)
          : onError(t(commonMessages.authorizationFailed) + developmentMessage)

        return
      }

      const authorizationCode = new URL(browserResult.url).searchParams.get('code')
      if (!authorizationCode) {
        paradym.logger.warn('Browser authorization failed. Missing authorization code in url', {
          browserResult,
          isDevelopmentModeEnabled,
        })

        toast.show(t(commonMessages.authorizationFailed), {
          customData: {
            preset: 'warning',
          },
        })

        onError(
          t(commonMessages.authorizationFailed) +
            (isDevelopmentModeEnabled
              ? `\n\nDevelopment mode error:\nMissing authorization code in url ${browserResult.url}`
              : '')
        )
        return
      }

      setHasHandledResult(true)
      onNext()
      onAuthFlowCallback(authorizationCode)
    }
  }, [
    isDevelopmentModeEnabled,
    browserResult,
    hasHandledResult,
    credentialAuthorizationCode,
    onAuthFlowCallback,
    paradym.logger.warn,
    toast.show,
    onCancel,
    onError,
    onNext,
    t,
  ])

  const onPresentationRequestReceived = (requestUri: string) => {
    if (!onPresentationRequest) return

    hasReceivedPresentationRequest.current = true
    setHasHandledResult(true)
    setIsResolvingPresentationRequest(true)

    // The browser is left for the presentation. After sharing, the authorization continues in a new
    // browser session at the redirect_uri the verifier returns. Android closes the browser itself.
    if (Platform.OS === 'ios') {
      WebBrowser.dismissAuthSession()
    }

    onPresentationRequest(requestUri)
      .then(() => onNext())
      .finally(() => setIsResolvingPresentationRequest(false))
  }

  const onPressContinue = async () => {
    // Next to a step that asks for a confirmation first, authorizing waits for it
    if (confirmCombined && !(await confirmCombined())) return

    if (onPresentationRequest) {
      setIssuanceAuthorizationPresentationRequestHandler(onPresentationRequestReceived)
    }

    const result = await openAuthSessionAsync(authCodeFlowDetails.openUrl, authCodeFlowDetails.redirectUri)
    // iOS can end the auth session with the redirect to the OpenID4VP request, instead of opening it as a deeplink
    if (result.type === 'success' && isOpenIdAuthorizationRequest(result.url)) {
      handleIssuanceAuthorizationPresentationRequest(result.url)
    }
    setIssuanceAuthorizationPresentationRequestHandler(undefined)

    // Leaving the browser for the presentation request dismisses it, which is not a failed authorization
    if (hasReceivedPresentationRequest.current) return
    setBrowserResult(result)
  }

  const hasAutoOpened = useRef(false)
  useEffect(() => {
    if (!autoOpen || hasAutoOpened.current) return
    hasAutoOpened.current = true
    void onPressContinue()
  })

  return (
    <YStack grow={1} justify="space-between">
      <YStack grow={1} gap="8">
        <YStack gap="5">
          <Heading>
            <Trans id="authCodeFlowSlide.heading" comment="Heading shown when user is about to authenticate">
              Verify your account
            </Trans>
          </Heading>
          <Paragraph>
            <Trans id="authCodeFlowSlide.description" comment="Explanation for why user is redirected to external site">
              To receive this card, you need to authorize with your account. You will now be redirected to the issuer's
              website.
            </Trans>
          </Paragraph>
        </YStack>
        <MiniCardRowItem
          name={display.name ?? t(commonMessages.unknown)}
          subtitle={display.issuer.name ?? t(commonMessages.unknown)}
          issuerImageUri={display.issuer.logo?.url}
          backgroundImageUri={display.backgroundImage?.url}
          backgroundColor={display.backgroundColor ?? 'grey-900'}
        />
      </YStack>
      <YStack borderTopWidth="1" borderColor="grey-200" pt="3" mx="-5" px="5" bg="background">
        <DualResponseButtons
          align="horizontal"
          acceptText={t({
            id: 'authCodeFlowSlide.authenticate',
            message: 'Authenticate',
            comment: 'Button label to start authentication process',
          })}
          declineText={t(commonMessages.stop)}
          onAccept={onPressContinue}
          onDecline={wizardOnCancel}
          isLoading={isResolvingPresentationRequest}
          variant={confirmCombined ? 'confirmation' : 'regular'}
        />
      </YStack>
    </YStack>
  )
}
