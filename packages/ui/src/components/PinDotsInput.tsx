import { type ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { TextInput } from 'react-native'
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated'
import { Circle, Input } from 'tamagui'
import { XStack, YStack } from '../base'

interface PinDotsInputProps {
  pinLength: number
  onPinComplete: (pin: string) => void
  autoFocus?: boolean
  isLoading?: boolean
}

export interface PinDotsInputRef {
  focus: () => void
  clear: () => void
  shake: () => void
}

export const PinDotsInput = forwardRef(
  ({ onPinComplete, pinLength, autoFocus, isLoading }: PinDotsInputProps, ref: ForwardedRef<PinDotsInputRef>) => {
    const [pin, setPin] = useState('')
    const inputRef = useRef<TextInput>(null)

    const pinDots = new Array(pinLength).fill(0).map((_, i) => isLoading || pin[i] !== undefined)

    const translationAnimations = pinDots.map(() => useSharedValue(0))
    const shakeAnimation = useSharedValue(0)

    // Shake animation
    const startShakeAnimation = useCallback(() => {
      shakeAnimation.value = withRepeat(
        withSequence(...[10, -7.5, 5, -2.5, 0].map((toValue) => withTiming(toValue, { duration: 75 }))),
        1,
        true
      )
    }, [shakeAnimation])

    useEffect(() => {
      translationAnimations.forEach((animation, index) => {
        // Go back down in 75 milliseconds
        if (!isLoading) {
          animation.value = withTiming(0, { duration: 75 })
          return
        }

        // Loading animation
        const delay = index * (500 / translationAnimations.length)
        animation.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(-10, { duration: 500 / 2 }),
              withTiming(0, { duration: 500 / 2 }),
              withDelay(500, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
          )
        )
      })
    }, [...translationAnimations, translationAnimations.forEach, translationAnimations.length, isLoading])

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => setPin(''),
        shake: () => startShakeAnimation(),
      }),
      [startShakeAnimation]
    )

    const onChangePin = (newPin: string) => {
      const sanitized = newPin.replace(/[^0-9]/g, '')
      setPin(sanitized)
      if (sanitized.length === 6) {
        onPinComplete(sanitized)
      }
    }

    return (
      <YStack onPress={() => inputRef.current?.focus()}>
        <Animated.View style={{ left: shakeAnimation }}>
          <XStack justifyContent="center" gap="$2">
            {pinDots.map((filled, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <Animated.View key={i} style={{ transform: [{ translateY: translationAnimations[i] }] }}>
                <Circle
                  size="$1.5"
                  backgroundColor={filled ? '$primary-500' : '$background'}
                  borderColor="$primary-500"
                  borderWidth="$1"
                />
              </Animated.View>
            ))}
          </XStack>
        </Animated.View>
        <Input
          ref={inputRef}
          value={pin}
          borderWidth={0}
          zIndex={-10000}
          position="absolute"
          onBlur={() => inputRef.current?.focus()}
          maxLength={pinLength}
          onChangeText={onChangePin}
          autoFocus={autoFocus}
          flex={1}
          height={0}
          width={0}
          inputMode="numeric"
          secureTextEntry
        />
      </YStack>
    )
  }
)
