import { type ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { TextInput } from 'react-native'
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { Circle, Input } from 'tamagui'
import { XStack, YStack } from '../base'
import { PinPad, PinValues } from './PinPad'

interface PinDotsInputProps {
  pinLength: number
  onPinComplete: (pin: string) => void
  isLoading?: boolean
  useNativeKeyboard?: boolean
  onBiometricsTap?: () => void
}

export interface PinDotsInputRef {
  /** Only applicable if using native keyboard */
  focus: () => void
  clear: () => void
  shake: () => void
}

export const PinDotsInput = forwardRef(
  (
    { onPinComplete, pinLength, isLoading, useNativeKeyboard = true, onBiometricsTap }: PinDotsInputProps,
    ref: ForwardedRef<PinDotsInputRef>
  ) => {
    const [pin, setPin] = useState('')
    const inputRef = useRef<TextInput>(null)

    const isInLoadingState = isLoading

    const pinDots = new Array(pinLength).fill(0).map((_, i) => isInLoadingState || pin[i] !== undefined)

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
        if (!isInLoadingState) {
          animation.value = withTiming(0, { duration: 75 })
          return
        }

        // Loading animation
        const delay = index * (500 / translationAnimations.length)
        animation.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(-10, { duration: 400 / 2, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
              withTiming(0, { duration: 400 / 2, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
              withDelay(500, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
          )
        )
      })
    }, [...translationAnimations, translationAnimations.forEach, translationAnimations.length, isInLoadingState])

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => setPin(''),
        shake: () => startShakeAnimation(),
      }),
      [startShakeAnimation]
    )

    const onPressPinNumber = (character: PinValues) => {
      if (character === PinValues.Backspace) {
        setPin((pin) => pin.slice(0, pin.length - 1))
        return
      }

      if (character === PinValues.Empty) {
        return
      }

      if (character === PinValues.Biometrics && onBiometricsTap) {
        onBiometricsTap()
        return
      }

      setPin((currentPin) => {
        const newPin = currentPin + character

        if (newPin.length === pinLength) {
          // If we don't do this the 6th dot will never be rendered and that looks weird
          setTimeout(() => onPinComplete(newPin), 100)
        }

        return newPin
      })
    }

    const onChangePin = (newPin: string) => {
      if (isLoading) return
      const sanitized = newPin.replace(/[^0-9]/g, '')
      setPin(sanitized)

      if (sanitized.length === pinLength) {
        // If we don't do this the 6th dot will never be rendered and that looks weird
        setTimeout(() => onPinComplete(newPin), 100)
      }
    }

    return (
      <YStack fg={1} jc="space-between" onPress={() => inputRef.current?.focus()}>
        <Animated.View style={{ left: shakeAnimation }}>
          <XStack justifyContent="center" gap="$2">
            {pinDots.map((filled, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <Animated.View key={i} style={{ transform: [{ translateY: translationAnimations[i] }] }}>
                <Circle
                  size="$1.5"
                  backgroundColor={filled ? '$primary-500' : '$background'}
                  borderColor="$primary-500"
                  borderWidth="$0.5"
                />
              </Animated.View>
            ))}
          </XStack>
        </Animated.View>
        {useNativeKeyboard ? (
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
        ) : (
          <PinPad
            onPressPinNumber={onPressPinNumber}
            disabled={isInLoadingState}
            useBiometricsPad={!!onBiometricsTap}
          />
        )}
      </YStack>
    )
  }
)
