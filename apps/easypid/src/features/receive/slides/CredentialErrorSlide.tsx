import { Button, Heading, HeroIcons, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import { useState } from 'react'

interface CredentialErrorSlideProps {
  reason?: string
  onCancel: () => void
}

export const CredentialErrorSlide = ({ reason, onCancel }: CredentialErrorSlideProps) => {
  const [scrollViewHeight, setScrollViewHeight] = useState(0)

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
            <Paragraph>
              An error occured while fetching the card information. Ask the issuer to generate a new QR-code or try
              again later.
            </Paragraph>
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
