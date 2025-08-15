import { bdrPidCredentialDisplay, bdrPidIssuerDisplay } from '@easypid/use-cases/bdrPidMetadata'
import { useLingui } from '@lingui/react/macro'
import { CardWithAttributes } from '@package/app'
import { commonMessages } from '@package/translations'
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
  const { t } = useLingui()
  const [isLoading, setIsLoading] = useState(false)

  const onSetupLater = () => {
    if (isLoading) return

    setIsLoading(true)
    onSkipCardSetup?.()
    setIsLoading(false)
  }

  const attributesInfo = t({
    id: 'onboardingIdCardRequestedAttributes.description',
    message: `These ${requestedAttributes.length} attributes will be read from your eID card.`,
    comment: 'Text explaining how many attributes will be read from the eID card',
  })

  const setUpLaterLabel = t({
    id: 'onboardingIdCardRequestedAttributes.setupLater',
    message: 'Set up later',
    comment: 'Button label to allow skipping card setup during onboarding',
  })

  const continueLabel = t(commonMessages.continue)

  return (
    <YStack flexBasis={0} flexGrow={1} justifyContent="space-between">
      <ScrollView mt="$-4">
        <YStack gap="$4">
          <Paragraph>{attributesInfo}</Paragraph>
          <CardWithAttributes
            name={t({
              id: 'eidCard.requestAttributesTitle',
              message: 'eID card',
              comment: 'Shown as the name of the credential card when requested attributes from eID card are shown',
            })}
            issuerImage={{ url: bdrPidIssuerDisplay.logo }}
            backgroundImage={{ url: bdrPidCredentialDisplay.backgroundImage }}
            backgroundColor={bdrPidCredentialDisplay.backgroundColor}
            textColor={bdrPidCredentialDisplay.textColor}
            formattedDisclosedAttributes={requestedAttributes.map((a) => sanitizeString(a))}
          />
        </YStack>
      </ScrollView>
      <YStack gap="$4" alignItems="center">
        {onSkipCardSetup && (
          <Button.Text icon={HeroIcons.ArrowRight} scaleOnPress onPress={onSetupLater}>
            {setUpLaterLabel}
          </Button.Text>
        )}
        <Button.Solid scaleOnPress onPress={goToNextStep}>
          {continueLabel}
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
