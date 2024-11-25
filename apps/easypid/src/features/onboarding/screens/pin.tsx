import { YStack } from '@package/ui'
import { PinDotsInput } from 'packages/app/src'
import type { PinDotsInputRef } from 'packages/app/src'
import React, { useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface OnboardingPinEnterProps {
  goToNextStep: (pin: string) => Promise<void>
}

export default function OnboardingPinEnter({ goToNextStep }: OnboardingPinEnterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)

  // Make the pin pad fixed to the bottom of the screen on smaller devices
  const { bottom } = useSafeAreaInsets()
  const shouldStickToBottom = bottom < 16

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
    <YStack mt="$10" fg={1} mb={shouldStickToBottom ? -16 : undefined}>
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
