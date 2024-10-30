import { CustomIcons, Heading, IllustrationContainer, Paragraph, YStack, useToastController } from '@package/ui'
import * as WebBrowser from 'expo-web-browser'
import { DualResponseButtons } from 'packages/app/src/components/DualResponseButtons'
import type { AuthCodeFlowDetails } from '../FunkeCredentialWithCodeFlowNotificationScreen'

interface AuthCodeFlowSlideProps {
  authCodeFlowDetails?: AuthCodeFlowDetails
  onAuthFlowCallback: (result: Record<string, unknown>) => void
  onCancel: () => void
}

export const AuthCodeFlowSlide = ({ authCodeFlowDetails, onAuthFlowCallback, onCancel }: AuthCodeFlowSlideProps) => {
  const toast = useToastController()

  const onPressContinue = async () => {
    if (!authCodeFlowDetails) return
    const result = await WebBrowser.openAuthSessionAsync(authCodeFlowDetails.openUrl)

    if (result.type !== 'success') {
      toast.show('Authorization not succeeded', { customData: { preset: 'warning' } })
      return
    }

    // === IMPLEMENT HERE ===
    onAuthFlowCallback({
      result,
    })
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
          onDecline={onCancel}
        />
      </YStack>
    </YStack>
  )
}
