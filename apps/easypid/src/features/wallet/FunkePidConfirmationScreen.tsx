import { FlexPage, Heading, HeroIcons, YStack } from '@package/ui'
import { PinDotsInput } from '@packages/app'
import type { PinDotsInputRef } from '@packages/app'
import { forwardRef } from 'react'
import { Circle } from 'tamagui'

export interface FunkePidConfirmationScreenProps {
  onSubmitPin: (pin: string) => void
  isLoading: boolean
}

export const FunkePidConfirmationScreen = forwardRef<PinDotsInputRef, FunkePidConfirmationScreenProps>(
  ({ onSubmitPin, isLoading }: FunkePidConfirmationScreenProps, ref) => {
    return (
      <FlexPage flex-1 safeArea="y" alignItems="center">
        <YStack flex-1 alignItems="center" justifyContent="flex-end" gap="$4">
          <Circle size="$4" backgroundColor="$grey-100">
            <HeroIcons.LockClosed strokeWidth={2} color="$grey-700" />
          </Circle>
          <Heading variant="h2" fontWeight="$semiBold">
            Enter your app PIN code
          </Heading>
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
