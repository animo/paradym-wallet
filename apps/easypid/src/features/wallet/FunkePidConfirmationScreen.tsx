import { FlexPage, HeroIcons, Paragraph, PinDotsInput, type PinDotsInputRef, YStack } from '@package/ui'
import React, { forwardRef } from 'react'
import { Circle } from 'tamagui'

export interface FunkePidConfirmationScreenProps {
  onSubmitPin: (pin: string) => void
  isLoading: boolean
}

export const FunkePidConfirmationScreen = forwardRef<PinDotsInputRef, FunkePidConfirmationScreenProps>(
  ({ onSubmitPin, isLoading }: FunkePidConfirmationScreenProps, ref) => {
    return (
      <FlexPage flex-1 safeArea="y" gap={0} alignItems="center">
        <YStack flex-1 alignItems="center" justifyContent="flex-end" gap="$2">
          <Circle size="$3" backgroundColor="$grey-100">
            <HeroIcons.LockClosed color="$grey-700" />
          </Circle>
          <Paragraph>Enter your app pin code</Paragraph>
        </YStack>
        <PinDotsInput
          isLoading={isLoading}
          ref={ref}
          pinLength={6}
          onPinComplete={onSubmitPin}
          useNativeKeyboard={false}
        />
      </FlexPage>
    )
  }
)
