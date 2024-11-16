import { YStack } from '@package/ui'
import { PinDotsInput } from 'packages/app/src'
import type { PinDotsInputRef } from 'packages/app/src'
import React, { useRef, useState } from 'react'

export interface OnboardingPinEnterProps {
  goToNextStep: (pin: string) => Promise<void>
}

export default function OnboardingPinEnter({ goToNextStep }: OnboardingPinEnterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)

  const onPinComplete = (pin: string) => {
    setIsLoading(true)
    goToNextStep(pin)
      .then(() => pinRef.current?.clear())
      .catch(() => {
        pinRef.current?.shake()
        pinRef.current?.clear()
      })
      .finally(() => setIsLoading(false))
  }

  return (
    <YStack mt="$10" fg={1}>
      <PinDotsInput
        onPinComplete={onPinComplete}
        isLoading={isLoading}
        pinLength={6}
        ref={pinRef}
        useNativeKeyboard={false}
      />
    </YStack>
  )
}
