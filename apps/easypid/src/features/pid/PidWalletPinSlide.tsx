import { Heading, Paragraph, YStack } from '@package/ui'
import { PinDotsInput, type PinDotsInputRef, useWizard } from 'packages/app/src'
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

  const onSubmitPin = async (pin: string) => {
    if (isLoading) return
    setIsLoading(true)

    await onEnterPin(pin).then(() => {
      onNext()
    })

    setIsLoading(false)
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6">
        <YStack gap="$3">
          <Heading variant="h1">{title}</Heading>
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
