import { Button, HeroIcons, OnboardingStepItem, Paragraph, ScrollableStack, YStack } from '@package/ui'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'

interface OnboardingIntroductionStepsProps {
  goToNextStep: () => void
}

export function OnboardingIntroductionSteps({ goToNextStep }: OnboardingIntroductionStepsProps) {
  const { t } = useLingui()

  const step1 = t({
    id: 'onboardingIntroduction.step1',
    message: 'Step 1',
    comment: 'Label for first onboarding step',
  })

  const step2 = t({
    id: 'onboardingIntroduction.step2',
    message: 'Step 2',
    comment: 'Label for second onboarding step',
  })

  const step1Title = t({
    id: 'onboardingIntroduction.step1.title',
    message: 'Secure the wallet',
    comment: 'Title of the first onboarding step explaining security setup',
  })

  const step1Description = t({
    id: 'onboardingIntroduction.step1.description',
    message: 'Choose a 6-digit PIN and set up biometrics to secure the wallet.',
    comment: 'Description of the first onboarding step about securing the wallet',
  })

  const step2Title = t({
    id: 'onboardingIntroduction.step2.title',
    message: 'Scan your physical ID card',
    comment: 'Title of the second onboarding step explaining card scanning',
  })

  const step2Description = t({
    id: 'onboardingIntroduction.step2.description',
    message: 'Use your ID card PIN to retrieve your identity information.',
    comment: 'Description of the second onboarding step about reading identity info',
  })

  const reminder = t({
    id: 'onboardingIntroduction.reminder',
    message: "You'll need your eID card to setup the wallet",
    comment: 'Reminder shown before user continues onboarding',
  })

  const continueLabel = t(commonMessages.continue)

  return (
    <YStack fg={1} jc="space-between">
      <YStack flex={1} overflow="hidden">
        <ScrollableStack gap="$2" pb="$4" accessible={true} accessibilityRole="list">
          <OnboardingStepItem
            stepName={step1}
            title={step1Title}
            description={step1Description}
            icon={<HeroIcons.Key color="$white" size={20} />}
          />
          <OnboardingStepItem
            stepName={step2}
            title={step2Title}
            description={step2Description}
            icon={<HeroIcons.Identification color="$white" size={20} />}
          />
        </ScrollableStack>
      </YStack>
      <YStack gap="$4" alignItems="center">
        <Paragraph variant="sub" py="$2" textAlign="center">
          {reminder}
        </Paragraph>
        <Button.Solid scaleOnPress alignSelf="stretch" onPress={goToNextStep}>
          {continueLabel}
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
