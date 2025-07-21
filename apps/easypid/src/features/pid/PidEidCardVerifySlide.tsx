//translations: no changes needed
import { Heading, Paragraph, YStack } from '@package/ui'
import { OnboardingIdCardVerify } from '../onboarding/screens/id-card-verify'

interface PidIdCardVerifySlideProps {
  onVerifyWithBiometrics: () => Promise<void>
  title: string
  subtitle?: string
}

export function PidIdCardVerifySlide({ onVerifyWithBiometrics, subtitle, title }: PidIdCardVerifySlideProps) {
  return (
    <YStack fg={1} gap="$6">
      <YStack gap="$3">
        <Heading variant="h1">{title}</Heading>
        {subtitle && <Paragraph>{subtitle}</Paragraph>}
      </YStack>
      <OnboardingIdCardVerify goToNextStep={onVerifyWithBiometrics} />
    </YStack>
  )
}
