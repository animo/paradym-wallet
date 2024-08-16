import { IdCard, Paragraph, Stack, XStack, YStack } from '@package/ui'
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { TextInput } from 'react-native'
import { Input } from 'tamagui'

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

  return (
    <>
      <Input
        ref={inputRef}
        value={pin}
        // borderWidth={0}
        // Setting borderWidth to 0 makes it not work on Android (maybe it needs to be 'visible'?)
        // So we set it to white, the same as the background
        borderColor="white"
        zIndex={-10000}
        position="absolute"
        onBlur={() => inputRef.current?.focus()}
        maxLength={pinLength}
        onChangeText={onChangePin}
        autoFocus
        flex={1}
        height={0}
        width={0}
        inputMode="numeric"
        secureTextEntry
      />
      <YStack gap="$4" flex-1>
        <IdCard icon={isLoading ? 'loading' : 'locked'} issuerImage={germanIssuerImage} />
        <XStack gap="$3" justifyContent="center">
          {pinValues.map((digit, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: index is the correct key here
            <YStack key={index} maxWidth={35} flex-1 justifyContent="center" alignItems="center">
              <Paragraph size="$6" fontWeight="$medium">
                {digit ?? ' '}
              </Paragraph>
              <Stack borderBottomWidth={1} borderBottomColor="$grey-900" width="100%" />
            </YStack>
          ))}
        </XStack>
      </YStack>
    </>
  )
})
