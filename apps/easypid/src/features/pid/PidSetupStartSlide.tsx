//translations: no changes needed
import { useWizard } from '@package/app'
import { Heading, Paragraph, YStack } from '@package/ui'
import { OnboardingDataProtection } from '../onboarding/screens/data-protection'

interface PidSetupStartSlideProps {
  title: string
  subtitle?: string
  onStart: (useShouldUseCloudHsm: boolean) => void
}

export function PidSetupStartSlide({ title, subtitle, onStart }: PidSetupStartSlideProps) {
  const { onNext } = useWizard()

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6">
        <YStack gap="$3">
          <Heading variant="h1">{title}</Heading>
          {subtitle && <Paragraph>{subtitle}</Paragraph>}
        </YStack>
      </YStack>
      <YStack fg={1} pt="$6">
        <OnboardingDataProtection
          goToNextStep={async (shouldUseCloudHsm) => {
            onNext()
            onStart(shouldUseCloudHsm)
          }}
        />
      </YStack>
    </YStack>
  )
}
