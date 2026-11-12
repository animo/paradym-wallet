import { useLingui } from '@lingui/react/macro'
// Deep imports: the credential request UI renders this too, and its bundle leaves out the `@package/ui` barrel,
// whose `MessageBox` animates through reanimated. This is that box's light variant.
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { Stack, XStack, YStack } from '@package/ui/base/Stacks'
import { Image } from '@package/ui/content/Image'
import type { DisplayImage } from '@paradym/wallet-sdk'
import { Circle } from 'tamagui'

interface RequestPurposeSectionProps {
  purpose: string
  logo?: DisplayImage
}

export function RequestPurposeSection({ purpose, logo }: RequestPurposeSectionProps) {
  const { t } = useLingui()

  const headingLabel = t({
    id: 'requestPurpose.purposeHeading',
    message: 'PURPOSE',
    comment: 'Heading above the stated purpose of the data request',
  })

  return (
    <YStack gap="2">
      <Heading heading="sub2">{headingLabel}</Heading>
      <XStack gap="2" p="4" bg="grey-50" borderRadius="8">
        <Paragraph flex={1} color="grey-700">
          {purpose}
        </Paragraph>
        {/* Without a logo there's nothing to show, so the purpose takes the room */}
        {logo?.url ? (
          <Stack items="center" justify="center">
            <Circle size="11" overflow="hidden">
              <Image circle src={logo.url} alt={logo.altText} width="100%" height="100%" contentFit="contain" />
            </Circle>
          </Stack>
        ) : null}
      </XStack>
    </YStack>
  )
}
