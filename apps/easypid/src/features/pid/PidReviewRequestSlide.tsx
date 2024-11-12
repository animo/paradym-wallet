import { usePidDisplay } from '@easypid/hooks'
import { Button, Circle, Heading, HeroIcons, Paragraph, Spinner, Stack, YStack } from '@package/ui'
import { CardWithAttributes, DualResponseButtons, useWizard } from 'packages/app/src'
import { sanitizeString } from 'packages/utils/src'
import { useState } from 'react'
import { OnboardingIdCardRequestedAttributes } from '../onboarding/screens/id-card-requested-attributes'

interface PidReviewRequestSlideProps {
  title: string
  requestedAttributes: string[]
}

export function PidReviewRequestSlide({ title, requestedAttributes }: PidReviewRequestSlideProps) {
  const { onNext } = useWizard()
  const display = usePidDisplay()

  const [isLoading, setIsLoading] = useState(false)

  const onContinue = () => {
    if (isLoading) return
    setIsLoading(true)

    // Do logic

    onNext()
    setIsLoading(false)
  }

  return (
    <YStack fg={1} gap="$6" jc="space-between">
      <YStack gap="$3">
        <Heading variant="h1">{title}</Heading>
      </YStack>
      <OnboardingIdCardRequestedAttributes goToNextStep={onContinue} requestedAttributes={requestedAttributes} />
    </YStack>
  )
}
