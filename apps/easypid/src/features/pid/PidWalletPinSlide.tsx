import { Heading, Paragraph, YStack } from '@package/ui'
import { PinDotsInput, type PinDotsInputRef, useWizard } from 'packages/app/src'
import { useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface PidWalletPinSlideProps {
  title: string
  subtitle?: string
  onEnterPin: (pin: string) => Promise<void>
}

export function PidWalletPinSlide({ title, subtitle, onEnterPin }: PidWalletPinSlideProps) {
  const { onNext } = useWizard()
  const [isLoading, setIsLoading] = useState(false)
  const ref = useRef<PinDotsInputRef>(null)

  // Make the pin pad fixed to the bottom of the screen on smaller devices
  const { bottom } = useSafeAreaInsets()
  const shouldStickToBottom = bottom < 16

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
    <YStack fg={1} jc="space-between" mb={shouldStickToBottom ? -16 : undefined}>
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
