import { useWizard } from '@package/app'
import { Heading, Paragraph, PinDotsInput, type PinDotsInputRef, YStack } from '@package/ui'
import { useRef, useState } from 'react'

export const PinSlide = ({ onPinComplete, isLoading }: { onPinComplete: () => Promise<void>; isLoading: boolean }) => {
  const { onNext } = useWizard()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)

  const unlockUsingPin = async (pin: string) => {
    // The pin is passed to the presentation request and from there we know if it's correct or not
    // For now, lets just mock.
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return
  }

  const onPinEnterComplete = (pin: string) => {
    setIsSubmitting(true)
    unlockUsingPin(pin)
      .then(() => {
        onPinComplete().then(() => onNext())
      })
      .catch((e) => {
        pinRef.current?.shake()
        pinRef.current?.clear()
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$4">
        <Heading>Send data with your PIN code</Heading>
        <Paragraph>Use your security PIN to confirm the request.</Paragraph>
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
