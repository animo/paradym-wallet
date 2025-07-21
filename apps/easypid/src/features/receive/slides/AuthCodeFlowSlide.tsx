import { Trans, useLingui } from '@lingui/react/macro'
import type { CredentialDisplay } from '@package/agent'
import { useWizard } from '@package/app'
import { DualResponseButtons } from '@package/app/components/DualResponseButtons'
import { commonMessages } from '@package/translations'
import { Heading, MiniCardRowItem, Paragraph, YStack, useToastController } from '@package/ui'
import { useGlobalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

export type AuthCodeFlowDetails = {
  domain: string
  redirectUri: string
  openUrl: string
}

interface AuthCodeFlowSlideProps {
  display: CredentialDisplay
  authCodeFlowDetails: AuthCodeFlowDetails
  onAuthFlowCallback: (authorizationCode: string) => void
  onCancel: () => void
  onError: () => void
}

export const AuthCodeFlowSlide = ({
  authCodeFlowDetails,
  onAuthFlowCallback,
  onCancel,
  onError,
  display,
}: AuthCodeFlowSlideProps) => {
  const toast = useToastController()
  const { t } = useLingui()
  const { onNext, onCancel: wizardOnCancel } = useWizard()
  const { credentialAuthorizationCode } = useGlobalSearchParams<{
    credentialAuthorizationCode?: string
  }>()
  const [browserResult, setBrowserResult] = useState<WebBrowser.WebBrowserAuthSessionResult>()
  const [hasHandledResult, setHasHandledResult] = useState(false)

  useEffect(() => {
    if (hasHandledResult) return

    // NOTE: credentialAuthorizationCode is set in +native-intent
    // after an external browser or app redirects back to us. In some
    // cases the in-app browser is exited (e.g. when authenticating from
    // a native app) and thus we need to manually dimiss the auth session
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
        toast.show(t(commonMessages.authorizationFailed), { customData: { preset: 'warning' } })

        browserResult.type === 'cancel' || browserResult.type === 'dismiss' ? onCancel() : onError()
        return
      }

      const authorizationCode = new URL(browserResult.url).searchParams.get('code')
      if (!authorizationCode) {
        toast.show(t(commonMessages.authorizationFailed), { customData: { preset: 'warning' } })
        onError()
        return
      }

      setHasHandledResult(true)
      onNext()
      onAuthFlowCallback(authorizationCode)
    }
  }, [
    browserResult,
    hasHandledResult,
    credentialAuthorizationCode,
    onAuthFlowCallback,
    toast.show,
    onCancel,
    onError,
    onNext,
    t,
  ])

  const onPressContinue = async () => {
    const result = await WebBrowser.openAuthSessionAsync(authCodeFlowDetails.openUrl, authCodeFlowDetails.redirectUri)
    setBrowserResult(result)
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack fg={1} gap="$6">
        <YStack gap="$4">
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
          name={display.name}
          subtitle={display.issuer.name}
          issuerImageUri={display.issuer.logo?.url}
          backgroundImageUri={display.backgroundImage?.url}
          backgroundColor={display.backgroundColor ?? '$grey-900'}
        />
      </YStack>
      <YStack btw="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4" bg="$background">
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
        />
      </YStack>
    </YStack>
  )
}
