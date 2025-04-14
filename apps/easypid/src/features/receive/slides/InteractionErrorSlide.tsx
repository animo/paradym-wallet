import { Button, Heading, HeroIcons, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import { useState } from 'react'

interface InteractionErrorSlideProps {
  reason?: string
  flowType: 'issue' | 'verify' | 'connect' | 'sign'
  onCancel: () => void
}

export const InteractionErrorSlide = ({ reason, onCancel, flowType }: InteractionErrorSlideProps) => {
  const [scrollViewHeight, setScrollViewHeight] = useState(0)

  const message =
    flowType === 'connect'
      ? 'An error occured while connecting. Generate a new QR-code or try again later.'
      : flowType === 'issue'
        ? 'An error occured while fetching the card information. Ask the issuer to generate a new QR-code or try again later.'
        : flowType === 'verify'
          ? 'An error occured while sharing the card information. Ask the verifier to generate a new QR-code or try again later.'
          : 'An error occured while signing with your card information. Ask the verifier to generate a new QR-code or try again later'

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6" fg={1} onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}>
        <ScrollView fg={1} maxHeight={scrollViewHeight} contentContainerStyle={{ gap: '$4' }}>
          <YStack gap="$4">
            <Heading>Something went wrong</Heading>
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
                <Paragraph variant="caption">Reason: </Paragraph>
                {reason}
              </Paragraph>
            </YStack>
          )}
        </ScrollView>
      </YStack>
      <Stack borderTopWidth="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4">
        <Button.Solid scaleOnPress onPress={onCancel}>
          Go to wallet <HeroIcons.ArrowRight size={20} color="$white" />
        </Button.Solid>
      </Stack>
    </YStack>
  )
}
