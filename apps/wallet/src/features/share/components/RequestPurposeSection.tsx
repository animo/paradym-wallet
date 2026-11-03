import { useLingui } from '@lingui/react/macro'
import { Circle, Heading, HeroIcons, Image, MessageBox, Stack, YStack } from '@package/ui'
import type { DisplayImage } from '@paradym/wallet-sdk'

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
      <MessageBox
        variant="light"
        message={purpose}
        icon={
          <Circle size="11" overflow="hidden">
            {logo?.url ? (
              <Image circle src={logo.url} alt={logo.altText} width="100%" height="100%" contentFit="contain" />
            ) : (
              <Stack bg="grey-200" width="100%" height="100%" items="center" justify="center">
                <HeroIcons.BuildingOffice color="grey-800" size={24} />
              </Stack>
            )}
          </Circle>
        }
      />
    </YStack>
  )
}
