import { PinDotsInput, type PinDotsInputRef, useWizard } from '@package/app'
import { Heading, Paragraph, YStack } from '@package/ui'
import { useRef, useState } from 'react'

import { Trans } from '@lingui/react/macro'

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
        <Heading>
          <Trans id="pinSlide.title" comment="Heading shown when user is asked to enter their app PIN to confirm a request">
            Send data with your PIN code
          </Trans>
        </Heading>
        <Paragraph>
          <Trans id="pinSlide.description" comment="Supporting text explaining why PIN is needed">
            Use your app PIN code to confirm the request.
          </Trans>
        </Paragraph>
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
