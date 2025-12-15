import { PinDotsInput, type PinDotsInputRef, useWizard } from '@package/app'
import { Heading, Paragraph, useDeviceMedia, YStack } from '@package/ui'
import { useRef, useState } from 'react'

interface PidWalletPinSlideProps {
  title: string
  subtitle?: string
  onEnterPin: (pin: string) => Promise<void>
}

export function PidWalletPinSlide({ title, subtitle, onEnterPin }: PidWalletPinSlideProps) {
  const { onNext } = useWizard()
  const [isLoading, setIsLoading] = useState(false)
  const ref = useRef<PinDotsInputRef>(null)
  const { additionalPadding, noBottomSafeArea } = useDeviceMedia()
  const onSubmitPin = async (pin: string) => {
    if (isLoading) return
    setIsLoading(true)

    await onEnterPin(pin)
      .then(() => {
        onNext()
      })
      .catch(() => {
        ref.current?.shake()
        ref.current?.clear()
      })

    setIsLoading(false)
  }

  return (
    <YStack fg={1} jc="space-between" mb={noBottomSafeArea ? -additionalPadding : undefined}>
      <YStack gap="$6">
        <YStack gap="$3">
          <Heading heading="h1">{title}</Heading>
          {subtitle && <Paragraph>{subtitle}</Paragraph>}
        </YStack>
      </YStack>
      <YStack flexGrow={1} mt="$10">
        <PinDotsInput
          isLoading={isLoading}
          ref={ref}
          pinLength={6}
          onPinComplete={onSubmitPin}
          useNativeKeyboard={false}
        />
      </YStack>
    </YStack>
  )
}
