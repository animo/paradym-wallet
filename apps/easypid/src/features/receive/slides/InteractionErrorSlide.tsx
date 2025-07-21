import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, Heading, HeroIcons, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import { useState } from 'react'

interface InteractionErrorSlideProps {
  reason?: string
  flowType: 'issue' | 'verify' | 'connect' | 'sign'
  onCancel: () => void
}

export const InteractionErrorSlide = ({ reason, onCancel, flowType }: InteractionErrorSlideProps) => {
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
    <YStack fg={1} jc="space-between">
      <YStack gap="$6" fg={1} onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}>
        <ScrollView fg={1} maxHeight={scrollViewHeight} contentContainerStyle={{ gap: '$4' }}>
          <YStack gap="$4">
            <Heading>{t(commonMessages.somethingWentWrong)}</Heading>
            <Stack alignSelf="flex-start">
              <XStack p="$4" bg="$grey-100" borderRadius="$4">
                <HeroIcons.NoSymbol color="$grey-800" size={32} />
              </XStack>
            </Stack>
            <Paragraph>{message}</Paragraph>
          </YStack>

          {reason && scrollViewHeight !== 0 && (
            <YStack>
              <Paragraph variant="sub">
                <Paragraph variant="caption">
                  {t({
                    id: 'interactionError.reasonPrefix',
                    message: 'Reason:',
                    comment: 'Label before displaying a backend or internal error message',
                  })}{' '}
                </Paragraph>
                {reason}
              </Paragraph>
            </YStack>
          )}
        </ScrollView>
      </YStack>

      <Stack borderTopWidth="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4">
        <Button.Solid scaleOnPress onPress={onCancel}>
          {t(commonMessages.goToWallet)} <HeroIcons.ArrowRight size={20} color="$white" />
        </Button.Solid>
      </Stack>
    </YStack>
  )
}
