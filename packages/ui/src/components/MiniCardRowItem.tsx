import { Heading, Paragraph, Stack, XStack, YStack } from '../base'
import { Image } from '../content'

interface MiniCardRowItemProps {
  name: string
  subtitle: string
  issuerImageUri?: string | number | undefined
  backgroundImageUri?: string | number | undefined
  backgroundColor: string
}

export function MiniCardRowItem({
  name,
  subtitle,
  issuerImageUri,
  backgroundImageUri,
  backgroundColor,
}: MiniCardRowItemProps) {
  return (
    <XStack
      gap="$4"
      ai="center"
      accessible={true}
      accessibilityRole="text"
      aria-label={`${name}. Issued by ${subtitle}.`}
    >
      <Stack p="$2" h="$6" w="$10" br="$4" overflow="hidden" pos="relative" bg={backgroundColor ?? '$grey-900'}>
        {backgroundImageUri && (
          <Stack pos="absolute" top={0} left={0} right={0} bottom={0}>
            <Image src={backgroundImageUri} alt="Card" contentFit="cover" height="100%" width="100%" />
          </Stack>
        )}
        {issuerImageUri && <Image src={issuerImageUri} alt="Issuer" width={16} height={16} />}
      </Stack>
      <YStack gap="$1" f={1} fg={1}>
        <Heading numberOfLines={1} variant="h3">
          {name}
        </Heading>
        <Paragraph numberOfLines={1}>{subtitle}</Paragraph>
      </YStack>
    </XStack>
  )
}
