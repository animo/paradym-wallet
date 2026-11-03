import type { ReactNode } from 'react'
import { Heading } from '../base/Headings'
import { Paragraph } from '../base/Paragraph'
import { Stack, XStack, YStack } from '../base/Stacks'
import { Image } from '../content/Image'

interface MiniCardRowItemProps {
  name: string
  subtitle: string
  issuerImageUri?: string | number | undefined
  backgroundImageUri?: string | number | undefined
  backgroundColor: string
  /**
   * The card's own design, such as its rendered SVG template. It replaces the background image and the
   * issuer logo.
   */
  artwork?: ReactNode
}

export function MiniCardRowItem({
  name,
  subtitle,
  issuerImageUri,
  backgroundImageUri,
  backgroundColor,
  artwork,
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
        {artwork ? (
          <Stack position="absolute" top={0} left={0} right={0} bottom={0}>
            {artwork}
          </Stack>
        ) : (
          <>
            {backgroundImageUri && (
              <Stack position="absolute" top={0} left={0} right={0} bottom={0}>
                <Image src={backgroundImageUri} alt="Card" contentFit="cover" height="100%" width="100%" />
              </Stack>
            )}
            {issuerImageUri && <Image src={issuerImageUri} alt="Issuer" width={16} height={16} />}
          </>
        )}
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
