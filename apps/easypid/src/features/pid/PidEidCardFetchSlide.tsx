//translations: no changes needed
import { useWizard } from '@package/app'
import { Heading, Paragraph, YStack } from '@package/ui'
import { useEffect } from 'react'
import { OnboardingIdCardFetch } from '../onboarding/screens/id-card-fetch'

interface PidIdCardFetchSlideProps {
  title: string
  subtitle?: string
  userName?: string
  onComplete: () => void
}

export function PidIdCardFetchSlide({ title, subtitle, userName, onComplete }: PidIdCardFetchSlideProps) {
  const { completeProgressBar } = useWizard()

  useEffect(() => {
    if (userName) {
      completeProgressBar()
    }
  }, [completeProgressBar, userName])

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
