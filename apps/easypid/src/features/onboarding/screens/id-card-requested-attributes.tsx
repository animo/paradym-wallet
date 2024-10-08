import { CardWithAttributes } from '@easypid/features/share/components/RequestedAttributesSection'
import { usePidDisplay } from '@easypid/hooks'
import { Button, Heading, HeroIcons, Paragraph, Stack, YStack } from '@package/ui'
import { sanitizeString } from '@package/utils'
import { Circle } from 'tamagui'

interface OnboardingIdCardRequestedAttributesProps {
  goToNextStep: () => void
  requestedAttributes: string[]
}

export function OnboardingIdCardRequestedAttributes({
  goToNextStep,
  requestedAttributes,
}: OnboardingIdCardRequestedAttributesProps) {
  const display = usePidDisplay()

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
            id="pid-display"
            name="eID card"
            backgroundImage={display?.backgroundImage}
            backgroundColor={display?.backgroundColor}
            disclosedAttributes={requestedAttributes.map((a) => sanitizeString(a))}
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
