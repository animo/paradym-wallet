import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, Heading, HeroIcons, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import { useState } from 'react'

interface InteractionErrorSlideProps {
  reason?: string
  flowType: 'issue' | 'verify' | 'connect' | 'sign'
  onCancel: () => void
  showReturnToApp?: boolean
}

export const InteractionErrorSlide = ({ reason, onCancel, flowType, showReturnToApp }: InteractionErrorSlideProps) => {
  const { t } = useLingui()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)

  const message =
    flowType === 'connect'
      ? t({
          id: 'interactionError.message.connect',
          message: 'An error occurred while connecting. Generate a new QR-code or try again later.',
          comment: 'Error message when connection fails during connect interaction',
        })
      : flowType === 'issue'
        ? t({
            id: 'interactionError.message.issue',
            message:
              'An error occurred while fetching the card information. Ask the issuer to generate a new QR-code or try again later.',
            comment: 'Error message when credential issuance fails to fetch card info',
          })
        : flowType === 'verify'
          ? t({
              id: 'interactionError.message.verify',
              message:
                'An error occurred while sharing the card information. Ask the verifier to generate a new QR-code or try again later.',
              comment: 'Error message when sharing a credential for verification fails',
            })
          : t({
              id: 'interactionError.message.sign',
              message:
                'An error occurred while signing with your card information. Ask the verifier to generate a new QR-code or try again later.',
              comment: 'Error message when signing fails with selected credentials',
            })

  return (
    <YStack grow={1} justify="space-between">
      <YStack gap="8" grow={1} onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}>
        <ScrollView grow={1} maxHeight={scrollViewHeight} contentContainerStyle={{ gap: '5' }}>
          <YStack gap="5">
            <Heading>{t(commonMessages.somethingWentWrong)}</Heading>
            <Stack alignSelf="flex-start">
              <XStack p="5" bg="grey-100" borderRadius="4">
                <HeroIcons.NoSymbol color="grey-800" size={32} />
              </XStack>
            </Stack>
            <Paragraph>{message}</Paragraph>
          </YStack>

          {reason && scrollViewHeight !== 0 && (
            <YStack>
              <Paragraph variant="sub">
                <Paragraph variant="caption">{t(commonMessages.errorReasonPrefix)} </Paragraph>
                {reason}
              </Paragraph>
            </YStack>
          )}
        </ScrollView>
      </YStack>

      <Stack gap="3" borderTopWidth="1" borderColor="grey-200" py="3" mx="-5" px="5">
        {showReturnToApp && (
          <Paragraph variant="annotation" text="center">
            {t(commonMessages.returnToPreviousApp)}
          </Paragraph>
        )}
        <Button.Solid scaleOnPress onPress={onCancel}>
          {t(commonMessages.goToWallet)} <HeroIcons.ArrowRight size={20} color="white" />
        </Button.Solid>
      </Stack>
    </YStack>
  )
}
