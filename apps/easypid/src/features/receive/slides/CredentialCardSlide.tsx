import type { CredentialDisplay } from '@package/agent'
import { Heading, MiniCardRowItem, Paragraph, Stack, YStack } from '@package/ui'
import { DualResponseButtons, useWizard } from 'packages/app/src'

interface CredentialCardSlideProps {
  type: 'presentation' | 'pin' | 'noAuth'
  display: CredentialDisplay
}

const getContentType = (type: 'presentation' | 'pin' | 'noAuth', issuerName: string) => {
  switch (type) {
    case 'presentation':
      return {
        title: 'Card offered',
        subtitle: `To receive this card from ${issuerName}, you need to share cards from your wallet.`,
      }
    case 'pin':
      return {
        title: 'Card offered',
        subtitle: `To receive this card from ${issuerName}, you need to enter a PIN.`,
      }
    default:
      return {
        title: 'Card offered',
        subtitle: `${issuerName} wants to issue you the following card:`,
      }
  }
}

export const CredentialCardSlide = ({ type = 'noAuth', display }: CredentialCardSlideProps) => {
  const { onNext, onCancel } = useWizard()

  const content = getContentType(type, display.issuer.name)

  const goToNextSlide = () => {
    onNext()
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6" fg={1}>
        <YStack gap="$4">
          <Heading>{content.title}</Heading>
          <Paragraph>{content.subtitle}</Paragraph>
        </YStack>
        <MiniCardRowItem
          name={display.name}
          subtitle={display.issuer.name}
          issuerImageUri={display.issuer.logo?.url}
          backgroundImageUri={display.backgroundImage?.url}
          backgroundColor={display.backgroundColor ?? '$grey-900'}
        />
      </YStack>
      <Stack btw={1} borderColor="$grey-100" p="$4" mx="$-4">
        <DualResponseButtons
          align="horizontal"
          onAccept={() => goToNextSlide()}
          onDecline={() => onCancel()}
          acceptText="Continue"
          declineText="Stop"
        />
      </Stack>
    </YStack>
  )
}
