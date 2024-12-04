import { bdrPidCredentialDisplay, bdrPidIssuerDisplay } from '@easypid/use-cases/bdrPidMetadata'
import { CardWithAttributes } from '@package/app'
import { Button, HeroIcons, Paragraph, ScrollView, YStack } from '@package/ui'
import { sanitizeString } from '@package/utils'
import { useState } from 'react'

interface OnboardingIdCardRequestedAttributesProps {
  goToNextStep: () => void
  onSkipCardSetup?: () => void
  requestedAttributes: string[]
}

export function OnboardingIdCardRequestedAttributes({
  goToNextStep,
  onSkipCardSetup,
  requestedAttributes,
}: OnboardingIdCardRequestedAttributesProps) {
  const [isLoading, setIsLoading] = useState(false)

  const onSetupLater = () => {
    if (isLoading) return

    setIsLoading(true)
    onSkipCardSetup?.()
    setIsLoading(false)
  }

  return (
    <YStack flexBasis={0} flexGrow={1} justifyContent="space-between">
      <ScrollView mt="$-4">
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
      </ScrollView>
      <YStack gap="$4" alignItems="center">
        {onSkipCardSetup && (
          <Button.Text icon={HeroIcons.ArrowRight} scaleOnPress onPress={onSetupLater}>
            Set up later
          </Button.Text>
        )}
        <Button.Solid scaleOnPress onPress={goToNextStep}>
          Continue
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
