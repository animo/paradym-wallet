import { IdCard, Paragraph, PinPad, PinValues, Stack, XStack, YStack } from '@package/ui'
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { TextInput } from 'react-native'

import germanIssuerImage from '../../../../assets/german-issuer-image.png'

export interface OnboardingIdCardPinEnterProps {
  goToNextStep: (idCardPin: string) => Promise<void>
}

const pinLength = 6

export const OnboardingIdCardPinEnter = forwardRef(({ goToNextStep }: OnboardingIdCardPinEnterProps, ref) => {
  const [pin, setPin] = useState('')
  const inputRef = useRef<TextInput>(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => setPin(''),
  }))

  const isLoading = pin.length === pinLength

  const pinValues = new Array(pinLength).fill(0).map((_, i) => pin[i])

  const onChangePin = (newPin: string) => {
    if (isLoading) return
    const sanitized = newPin.replace(/[^0-9]/g, '')
    setPin(sanitized)

    if (sanitized.length === pinLength) {
      // If we don't do this the 6th value will never be rendered and that looks weird
      setTimeout(() => goToNextStep(newPin).catch(() => setPin('')), 100)
    }
  }

  const onPressPinNumber = (character: PinValues) => {
    if (character === PinValues.Backspace) {
      setPin((pin) => pin.slice(0, pin.length - 1))
      return
    }

    if (character === PinValues.Empty) {
      return
    }

    setPin((currentPin) => {
      const newPin = currentPin + character

      if (newPin.length === pinLength) {
        // If we don't do this the 6th dot will never be rendered and that looks weird
        setTimeout(() => onChangePin(newPin), 100)
      }

      return newPin
    })
  }

  return (
    <YStack fg={1} jc="space-between" gap="$6">
      <YStack gap="$6">
        <IdCard icon={isLoading ? 'loading' : 'locked'} issuerImage={germanIssuerImage} />
        <XStack gap="$3" justifyContent="center">
          {pinValues.map((digit, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: index is the correct key here
            <YStack key={index} maxWidth={28} flex-1 justifyContent="center" alignItems="center">
              <Paragraph lineHeight={32} size="$7" fontWeight="$medium">
                {digit ?? ' '}
              </Paragraph>
              <Stack borderBottomWidth={2} borderBottomColor="$grey-900" width="100%" />
            </YStack>
          ))}
        </XStack>
      </YStack>
      <PinPad onPressPinNumber={onPressPinNumber} disabled={isLoading} />
    </YStack>
  )
})
