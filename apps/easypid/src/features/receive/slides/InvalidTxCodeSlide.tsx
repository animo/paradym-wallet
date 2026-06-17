import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, Heading, HeroIcons, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import { useState } from 'react'

interface InvalidTxCodeSlideProps {
  onCancel: () => void
}

export const InvalidTxCodeSlide = ({ onCancel }: InvalidTxCodeSlideProps) => {
  const { t } = useLingui()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6" fg={1} onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}>
        <ScrollView fg={1} maxHeight={scrollViewHeight} contentContainerStyle={{ gap: '$4' }}>
          <YStack gap="$4">
            <Heading>
              {t({
                id: 'invalidTxCode.title',
                message: 'Incorrect transaction code',
                comment: 'Heading shown when the user entered a wrong transaction code during issuance',
              })}
            </Heading>
            <Stack alignSelf="flex-start">
              <XStack p="$4" bg="$grey-100" borderRadius="$4">
                <HeroIcons.NoSymbol color="$grey-800" size={32} />
              </XStack>
            </Stack>
            <Paragraph>
              {t({
                id: 'invalidTxCode.message',
                message:
                  'The transaction code you entered is incorrect. Ask the issuer to generate a new QR-code and try again.',
                comment: 'Body explaining that the transaction code was wrong and how to recover',
              })}
            </Paragraph>
          </YStack>
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
