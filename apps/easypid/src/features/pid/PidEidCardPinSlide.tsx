import { Heading, Paragraph, YStack } from '@package/ui'
import { useWizard } from 'packages/app/src'
import { useState } from 'react'
import { OnboardingIdCardPinEnter } from '../onboarding/screens/id-card-pin'

interface PidEidCardPinSlideProps {
  title: string
  subtitle?: string
  onEnterPin: (pin: string) => void
}

export function PidEidCardPinSlide({ title, subtitle, onEnterPin }: PidEidCardPinSlideProps) {
  const { onNext } = useWizard()
  const [isLoading, setIsLoading] = useState(false)

  const onSubmitPin = async (pin: string) => {
    if (isLoading) return
    setIsLoading(true)

    onEnterPin(pin)
    onNext()
    setIsLoading(false)
  }

  return (
    <YStack fg={1} gap="$6">
      <YStack gap="$3">
        <Heading variant="h1">{title}</Heading>
        {subtitle && <Paragraph>{subtitle}</Paragraph>}
      </YStack>
      <OnboardingIdCardPinEnter goToNextStep={onSubmitPin} />
    </YStack>
  )
}
