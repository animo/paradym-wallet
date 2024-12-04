import { PinDotsInput, type PinDotsInputRef, usePushToWallet, useWizard } from '@package/app'
import { Heading, Paragraph, YStack, useToastController } from '@package/ui'
import { useRef, useState } from 'react'
import type { PresentationRequestResult } from '../components/utils'

interface PinSlideProps {
  onPinComplete: (pin: string) => Promise<PresentationRequestResult | undefined>
  isLoading: boolean
}

export const PinSlide = ({ onPinComplete, isLoading }: PinSlideProps) => {
  const { onNext } = useWizard()
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)

  const onPinEnterComplete = (pin: string) => {
    setIsSubmitting(true)

    onPinComplete(pin)
      .then((r) => {
        if (!r || r.status === 'success') return onNext()

        toast.show(r.result.title, {
          message: r.result.message,
          customData: { preset: 'danger' },
        })

        pinRef.current?.shake()
        pinRef.current?.clear()

        if (r.redirectToWallet) return pushToWallet()
      })
      .finally(() => setIsSubmitting(false))
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
