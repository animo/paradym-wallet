import { PinDotsInput, type PinDotsInputRef } from '@package/ui'
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
    <PinDotsInput
      onPinComplete={onPinComplete}
      isLoading={isLoading}
      pinLength={6}
      ref={pinRef}
      useNativeKeyboard={false}
    />
  )
}
