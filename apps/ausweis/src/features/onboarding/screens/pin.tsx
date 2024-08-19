import { PinDotsInput, type PinDotsInputRef } from '@package/ui'
import React, { useRef } from 'react'

export interface OnboardingPinEnterProps {
  goToNextStep: (pin: string) => Promise<void>
}

export default function OnboardingPinEnter({ goToNextStep }: OnboardingPinEnterProps) {
  const pinRef = useRef<PinDotsInputRef>(null)

  const onPinComplete = (pin: string) =>
    goToNextStep(pin)
      .then(() => pinRef.current?.clear())
      .catch(() => {
        pinRef.current?.shake()
        pinRef.current?.clear()
      })

  return <PinDotsInput onPinComplete={onPinComplete} pinLength={6} ref={pinRef} useNativeKeyboard={true} />
}
