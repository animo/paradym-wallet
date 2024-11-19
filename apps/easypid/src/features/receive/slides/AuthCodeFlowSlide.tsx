import { useWizard } from '@package/app'
import { CustomIcons, Heading, IllustrationContainer, Paragraph, YStack, useToastController } from '@package/ui'
import * as WebBrowser from 'expo-web-browser'
import { DualResponseButtons } from '@package/app/src/components/DualResponseButtons'

export type AuthCodeFlowDetails = {
  domain: string
  redirectUri: string
  openUrl: string
}

interface AuthCodeFlowSlideProps {
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
}: AuthCodeFlowSlideProps) => {
  const toast = useToastController()
  const { onNext, onCancel: wizardOnCancel } = useWizard()

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
      <YStack gap="$4">
        <Heading>Authorization required</Heading>
        <IllustrationContainer>
          <CustomIcons.Connect color="$white" size={56} />
        </IllustrationContainer>
        <Paragraph>
          To receive this credential, you need to authorize with your account. You will now be redirected to the
          issuer's website.
        </Paragraph>
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
