import { useHasInternetConnection, useWizard } from '@package/app'
import { DualResponseButtons } from '@package/app/src/components/DualResponseButtons'
import { Heading, MiniCardRowItem, Paragraph, YStack, useToastController } from '@package/ui'
import * as WebBrowser from 'expo-web-browser'
import type { CredentialDisplay } from 'packages/agent/src'

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
  const { onNext, onCancel: wizardOnCancel } = useWizard()
  const hasInternet = useHasInternetConnection()

  const onPressContinue = async () => {
    const result = await WebBrowser.openAuthSessionAsync(authCodeFlowDetails.openUrl, authCodeFlowDetails.redirectUri)

    if (result.type !== 'success') {
      toast.show('Authorization failed', { customData: { preset: 'warning' } })

      result.type === 'cancel' || result.type === 'dismiss' ? onCancel() : onError()
      return
    }

    const authorizationCode = new URL(result.url).searchParams.get('code')
    if (!authorizationCode) {
      toast.show('Authorization failed', { customData: { preset: 'warning' } })
      onError()
      return
    }

    onNext()
    onAuthFlowCallback(authorizationCode)
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack fg={1} gap="$6">
        <YStack gap="$4">
          <Heading>Verify your account</Heading>
          <Paragraph>
            To receive this card, you need to authorize with your account. You will now be redirected to the issuer's
            website.
          </Paragraph>
        </YStack>
        <MiniCardRowItem
          name={display.name}
          subtitle={display.issuer.name}
          issuerImageUri={display.issuer.logo?.url}
          backgroundImageUri={display.backgroundImage?.url}
          backgroundColor={display.backgroundColor ?? '$grey-900'}
          hasInternet={hasInternet}
        />
      </YStack>
      <YStack btw="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4" bg="$background">
        <DualResponseButtons
          align="horizontal"
          acceptText="Authenticate"
          declineText="Stop"
          onAccept={onPressContinue}
          onDecline={wizardOnCancel}
        />
      </YStack>
    </YStack>
  )
}
