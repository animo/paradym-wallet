import { Button, Heading, HeroIcons, Paragraph, Stack, XStack, YStack } from '@package/ui'

export const CredentialErrorSlide = ({ reason, onCancel }: { reason?: string; onCancel: () => void }) => {
  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6">
        <YStack gap="$2">
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
          {reason && (
            <Paragraph variant="sub">
              <Paragraph variant="caption">Reason: </Paragraph>
              {reason}
            </Paragraph>
          )}
        </YStack>
      </YStack>
      <Stack borderTopWidth="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4">
        <Button.Solid scaleOnPress onPress={onCancel}>
          Go to wallet
        </Button.Solid>
      </Stack>
    </YStack>
  )
}
