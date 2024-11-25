import { bdrPidCredentialDisplay, bdrPidIssuerDisplay } from '@easypid/use-cases/bdrPidMetadata'
import { Button, Heading, HeroIcons, Paragraph, Stack, YStack } from '@package/ui'
import { sanitizeString } from '@package/utils'
import { CardWithAttributes } from 'packages/app/src'
import { Circle } from 'tamagui'

interface OnboardingIdCardRequestedAttributesProps {
  goToNextStep: () => void
  requestedAttributes: string[]
}

export function OnboardingIdCardRequestedAttributes({
  goToNextStep,
  requestedAttributes,
}: OnboardingIdCardRequestedAttributesProps) {
  return (
    <Stack flexBasis={0} flexGrow={1} justifyContent="space-between">
      <YStack gap="$2">
        <Circle size="$2.5" mb="$2" backgroundColor="$primary-500">
          <HeroIcons.CircleStack color="$white" size={18} />
        </Circle>
        <Heading variant="h3" fontWeight="$semiBold">
          Requested data
        </Heading>
        <YStack gap="$4">
          <Paragraph>These {requestedAttributes.length} attributes will be read from your eID card.</Paragraph>
          <CardWithAttributes
            name="eID card"
            issuerImage={{ url: bdrPidIssuerDisplay.logo }}
            backgroundImage={{ url: bdrPidCredentialDisplay.backgroundImage }}
            backgroundColor={bdrPidCredentialDisplay.backgroundColor}
            formattedDisclosedAttributes={requestedAttributes.map((a) => sanitizeString(a))}
          />
        </YStack>
      </YStack>
      <Stack>
        <Button.Solid scaleOnPress onPress={goToNextStep}>
          Continue
        </Button.Solid>
      </Stack>
    </Stack>
  )
}
