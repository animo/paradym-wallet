import { Heading, YStack } from '@package/ui'
import { useWizard } from '@packages/app'
import { OnboardingIdCardRequestedAttributes } from '../onboarding/screens/id-card-requested-attributes'

interface PidReviewRequestSlideProps {
  title: string
  requestedAttributes: string[]
}

export function PidReviewRequestSlide({ title, requestedAttributes }: PidReviewRequestSlideProps) {
  const { onNext } = useWizard()

  return (
    <YStack fg={1} gap="$6" jc="space-between">
      <YStack gap="$3">
        <Heading variant="h1">{title}</Heading>
      </YStack>
      <OnboardingIdCardRequestedAttributes
        goToNextStep={async () => onNext()}
        requestedAttributes={requestedAttributes}
      />
    </YStack>
  )
}
