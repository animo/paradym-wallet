import { Circle, Heading, HeroIcons, Image, MessageBox, Stack, YStack } from '@package/ui'
import type { DisplayImage } from 'packages/agent/src'

interface RequestPurposeSectionProps {
  purpose: string
  logo?: DisplayImage
}

export function RequestPurposeSection({ purpose, logo }: RequestPurposeSectionProps) {
  return (
    <YStack gap="$2">
      <Heading variant="sub2">PURPOSE</Heading>
      <MessageBox
        variant="light"
        message={purpose}
        icon={
          <Circle size="$4" overflow="hidden">
            {logo?.url ? (
              <Image circle src={logo.url} alt={logo.altText} width="100%" height="100%" resizeMode="cover" />
            ) : (
              <Stack bg="$grey-200" width="100%" height="100%" ai="center" jc="center">
                <HeroIcons.BuildingOffice color="$grey-800" size={24} />
              </Stack>
            )}
          </Circle>
        }
      />
    </YStack>
  )
}
