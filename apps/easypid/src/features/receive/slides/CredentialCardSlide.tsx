import type { CredentialDisplay } from '@package/agent'
import { DualResponseButtons, useWizard } from '@package/app'
import {
  Heading,
  MiniCardRowItem,
  Paragraph,
  Stack,
  YStack,
} from '@package/ui'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'

interface CredentialCardSlideProps {
  type: 'presentation' | 'pin' | 'noAuth'
  display: CredentialDisplay
}

const getContentType = (
  type: 'presentation' | 'pin' | 'noAuth',
  issuerName: string
) => {
  const {t } = useLingui()
  switch (type) {
    case 'presentation':
      return {
        title: t({
          id: 'credentialCardSlide.title',
          message: 'Card offered',
          comment: 'Title shown when a credential card is offered to the user',
        }),
        subtitle: t({
          id: 'credentialCardSlide.subtitle.presentation',
          message: `To receive this card from ${issuerName}, you need to share cards from your wallet.`,
          comment:
            'Subtitle shown when presentation of other credentials is required',
        }),
      }
    case 'pin':
      return {
        title: t({
          id: 'credentialCardSlide.title',
          message: 'Card offered',
          comment: 'Title shown when a credential card is offered to the user',
        }),
        subtitle: t({
          id: 'credentialCardSlide.subtitle.pin',
          message: `To receive this card from ${issuerName}, you need to enter a PIN.`,
          comment:
            'Subtitle shown when entering a PIN is required to receive the credential',
        }),
      }
    default:
      return {
        title: t({
          id: 'credentialCardSlide.title',
          message: 'Card offered',
          comment: 'Title shown when a credential card is offered to the user',
        }),
        subtitle: t({
          id: 'credentialCardSlide.subtitle.default',
          message: `${issuerName} wants to issue you the following card:`,
          comment:
            'Subtitle shown when the issuer wants to give the user a card with no auth required',
        }),
      }
  }
}

export const CredentialCardSlide = ({
  type = 'noAuth',
  display,
}: CredentialCardSlideProps) => {
  const { t } = useLingui()
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
          onAccept={goToNextSlide}
          onDecline={onCancel}
          acceptText={t(commonMessages.continue)}
          declineText={t(commonMessages.stop)}
        />
      </Stack>
    </YStack>
  )
}
