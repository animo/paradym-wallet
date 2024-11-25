import { usePidDisplay } from '@easypid/hooks'
import { Button, Heading, HeroIcons, Paragraph, Stack, YStack } from '@package/ui'
import { sanitizeString } from '@package/utils'
import { CardWithAttributes } from 'packages/app/src'
import { useState } from 'react'
import { Circle } from 'tamagui'

interface OnboardingIdCardRequestedAttributesProps {
  goToNextStep: () => void
  onSkipCardSetup: () => void
  requestedAttributes: string[]
}

export function OnboardingIdCardRequestedAttributes({
  goToNextStep,
  onSkipCardSetup,
  requestedAttributes,
}: OnboardingIdCardRequestedAttributesProps) {
  const display = usePidDisplay()

  const [isLoading, setIsLoading] = useState(false)

  const onSetupLater = () => {
    if (isLoading) return

    setIsLoading(true)
    onSkipCardSetup()
    setIsLoading(false)
  }

  return (
    <YStack flexBasis={0} flexGrow={1} justifyContent="space-between">
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
            issuerImage={display?.issuer.logo}
            backgroundImage={display?.backgroundImage}
            backgroundColor={display?.backgroundColor}
            disclosedAttributes={requestedAttributes.map((a) => sanitizeString(a))}
            disableNavigation
          />
        </YStack>
      </YStack>
      <YStack gap="$4" alignItems="center">
        <Button.Text icon={HeroIcons.ArrowRight} scaleOnPress onPress={onSetupLater}>
          Set up later
        </Button.Text>
        <Button.Solid scaleOnPress onPress={goToNextStep}>
          Continue
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
