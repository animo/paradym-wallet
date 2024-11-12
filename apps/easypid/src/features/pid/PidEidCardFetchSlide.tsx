import { Heading, Paragraph, YStack } from '@package/ui'
import { useEffect } from 'react'
import { OnboardingIdCardFetch } from '../onboarding/screens/id-card-fetch'

interface PidIdCardFetchSlideProps {
  title: string
  subtitle?: string
  userName?: string
  onFetch: () => void
  onComplete: () => void
}

export function PidIdCardFetchSlide({ title, subtitle, userName, onFetch, onComplete }: PidIdCardFetchSlideProps) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    void onFetch()
  }, [])

  return (
    <YStack fg={1} gap="$6">
      <YStack gap="$3">
        <Heading variant="h1">{title}</Heading>
        {subtitle && <Paragraph>{subtitle}</Paragraph>}
      </YStack>
      <OnboardingIdCardFetch goToNextStep={onComplete} userName={userName} />
    </YStack>
  )
}
