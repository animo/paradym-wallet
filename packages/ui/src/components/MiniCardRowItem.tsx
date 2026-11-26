import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import type { ReactNode } from 'react'
import { Heading } from '../base/Headings'
import { Paragraph } from '../base/Paragraph'
import { Stack, XStack, YStack } from '../base/Stacks'
import { Image } from '../content/Image'
import { useIsAccessibilityTextSize } from '../hooks/useIsAccessibilityTextSize'

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
  /** A smaller name and card, for rows that leave the name little width. */
  compact?: boolean
  /** Lets the name and subtitle wrap in full, for screens that may not shorten what they show. */
  wrap?: boolean
}

export function MiniCardRowItem({
  name,
  subtitle,
  issuerImageUri,
  backgroundImageUri,
  backgroundColor,
  artwork,
  compact = false,
  wrap = false,
}: MiniCardRowItemProps) {
  const { t } = useLingui()
  // Beside the card a name that may not be shortened has too little width at accessibility text sizes and
  // breaks inside words, so it goes below the card instead
  const isAccessibilityTextSize = useIsAccessibilityTextSize()
  const isStacked = wrap && isAccessibilityTextSize

  return (
    <XStack
      flexDirection={isStacked ? 'column' : 'row'}
      gap={isStacked ? '3' : '5'}
      items={isStacked ? 'flex-start' : 'center'}
      accessible={true}
      accessibilityRole="text"
      aria-label={`${name}. ${t(commonMessages.issuedByWithName(subtitle))}.`}
    >
      <Stack
        p="2"
        h={compact ? '12' : '16'}
        w={compact ? 78 : 104}
        rounded="4"
        overflow="hidden"
        position="relative"
        bg={backgroundColor ?? 'grey-900'}
      >
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
            {issuerImageUri && <Image circle src={issuerImageUri} alt="Issuer" width={16} height={16} />}
          </>
        )}
      </Stack>
      <YStack gap="0-5" flex={isStacked ? undefined : 1} grow={1} alignSelf={isStacked ? 'stretch' : undefined}>
        <Heading numberOfLines={wrap ? undefined : 2} heading={compact ? 'h4' : 'h3'}>
          {name}
        </Heading>
        <Paragraph numberOfLines={wrap ? undefined : 1}>{subtitle}</Paragraph>
      </YStack>
    </XStack>
  )
}
