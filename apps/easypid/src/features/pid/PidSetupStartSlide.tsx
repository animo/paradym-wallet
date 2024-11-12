import { Heading, Paragraph, YStack } from '@package/ui'
import { useWizard } from 'packages/app/src'
import { useState } from 'react'
import { OnboardingIdCardStart } from '../onboarding/screens/id-card-start'

interface PidSetupStartSlideProps {
  title: string
  subtitle?: string
  caption?: string
}

export function PidSetupStartSlide({ title, subtitle, caption }: PidSetupStartSlideProps) {
  const { onNext } = useWizard()
  const [isLoading, setIsLoading] = useState(false)

  const onContinue = async () => {
    if (isLoading) return
    setIsLoading(true)

    // Do logic

    onNext()
    setIsLoading(false)
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6">
        <YStack gap="$3">
          <Heading variant="h1">{title}</Heading>
          {subtitle && <Paragraph>{subtitle}</Paragraph>}
          {caption && (
            <Paragraph>
              <Paragraph emphasis>Remember:</Paragraph> {caption}
            </Paragraph>
          )}
        </YStack>
      </YStack>
      <YStack fg={1} pt="$6">
        <OnboardingIdCardStart goToNextStep={onContinue} />
      </YStack>
    </YStack>
  )
}
