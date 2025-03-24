import { useWizard } from '@package/app'
import { Heading, Paragraph, YStack } from '@package/ui'
import { useState } from 'react'
import { OnboardingIdCardScan, type OnboardingIdCardScanProps } from '../onboarding/screens/id-card-scan'

interface PidCardScanSlideProps extends OnboardingIdCardScanProps {
  title: string
  subtitle?: string
}

export function PidCardScanSlide({ title, subtitle, onStartScanning, ...props }: PidCardScanSlideProps) {
  const { onNext } = useWizard()
  const [isLoading, setIsLoading] = useState(false)

  const onStartScan = async () => {
    if (isLoading) return
    setIsLoading(true)

    await onStartScanning?.()

    setIsLoading(false)
  }

  return (
    <YStack fg={1} gap="$6">
      <YStack gap="$3">
        <Heading variant="h1">{title}</Heading>
        {subtitle && <Paragraph>{subtitle}</Paragraph>}
      </YStack>
      <OnboardingIdCardScan {...props} onStartScanning={onStartScan} />
    </YStack>
  )
}
