import { PinDotsInput, type PinDotsInputRef, useWizard } from '@package/app'
import { Heading, Paragraph, YStack } from '@package/ui'
import { useRef, useState } from 'react'

export interface onPinSubmitProps {
  pin?: string
  onPinComplete?: () => void
  onPinError?: () => void
}

export interface PinSlideProps {
  onPinSubmit: ({ pin, onPinComplete, onPinError }: onPinSubmitProps) => Promise<void>
  isLoading: boolean
}

export const PinSlide = ({ onPinSubmit, isLoading }: PinSlideProps) => {
  const { onNext } = useWizard()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)

  const onPinEnterComplete = (pin: string) => {
    setIsSubmitting(true)

    onPinSubmit({
      pin,
      onPinComplete: () => onNext(),
      onPinError: () => {
        pinRef.current?.shake()
        pinRef.current?.clear()
      },
    }).finally(() => setIsSubmitting(false))
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$4">
        <Heading>Send data with your PIN code</Heading>
        <Paragraph>Use your app PIN code to confirm the request.</Paragraph>
      </YStack>
      <YStack fg={1} mt="$10">
        <PinDotsInput
          onPinComplete={onPinEnterComplete}
          isLoading={isLoading || isSubmitting}
          pinLength={6}
          ref={pinRef}
          useNativeKeyboard={false}
        />
      </YStack>
    </YStack>
  )
}
