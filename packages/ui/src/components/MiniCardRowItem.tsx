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
      gap="5"
      items="center"
      accessible={true}
      accessibilityRole="text"
      aria-label={`${name}. Issued by ${subtitle}.`}
    >
      <Stack p="2" h="16" w={104} rounded="4" overflow="hidden" position="relative" bg={backgroundColor ?? 'grey-900'}>
        {backgroundImageUri && (
          <Stack position="absolute" top={0} left={0} right={0} bottom={0}>
            <Image src={backgroundImageUri} alt="Card" contentFit="cover" height="100%" width="100%" />
          </Stack>
        )}
        {issuerImageUri && <Image src={issuerImageUri} alt="Issuer" width={16} height={16} />}
      </Stack>
      <YStack gap="0-5" flex={1} grow={1}>
        <Heading numberOfLines={1} heading="h3">
          {name}
        </Heading>
        <Paragraph numberOfLines={1}>{subtitle}</Paragraph>
      </YStack>
    </XStack>
  )
}
