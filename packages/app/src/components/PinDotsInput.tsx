import { XStack, YStack } from '@package/ui/base/Stacks'
import { PinPad, PinValues } from '@package/ui/components/PinPad'
import { type ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'
import { Circle, Input, type InputRef } from 'tamagui'
import { useHaptics } from '../hooks/useHaptics'

interface PinDotsInputProps {
  pinLength: number
  onPinComplete: (pin: string) => void
  isLoading?: boolean
  useNativeKeyboard?: boolean
  onBiometricsTap?: () => void
  biometricsType?: 'face' | 'fingerprint'
}

export interface PinDotsInputRef {
  /** Only applicable if using native keyboard */
  focus: () => void
  clear: () => void
  shake: () => void
}

interface PinDotProps {
  filled: boolean
  index: number
  totalDots: number
  isLoading: boolean
}

const PinDot = ({ filled, index, totalDots, isLoading }: PinDotProps) => {
  const animation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(animation, { toValue: 0, duration: 75, useNativeDriver: true }).start()
      return
    }

    const easing = Easing.bezier(0.42, 0, 0.58, 1)
    const bounce = Animated.sequence([
      Animated.delay(index * (500 / totalDots)),
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, { toValue: -10, duration: 400 / 2, easing, useNativeDriver: true }),
          Animated.timing(animation, { toValue: 0, duration: 400 / 2, easing, useNativeDriver: true }),
          Animated.delay(500),
        ])
      ),
    ])

    bounce.start()
    // Unlike a shared value the loop keeps running on its own, so it has to be stopped before the
    // effect below animates the dot back down.
    return () => bounce.stop()
  }, [isLoading, index, totalDots, animation])

  return (
    <Animated.View style={{ transform: [{ translateY: animation }] }}>
      <Circle
        size="$1.5"
        backgroundColor={filled ? '$primary-500' : '$background'}
        borderColor="$primary-500"
        borderWidth="$1"
      />
    </Animated.View>
  )
}

export const PinDotsInput = forwardRef(
  (
    {
      onPinComplete,
      pinLength,
      isLoading,
      useNativeKeyboard = true,
      onBiometricsTap,
      biometricsType,
    }: PinDotsInputProps,
    ref: ForwardedRef<PinDotsInputRef>
  ) => {
    const { withHaptics, errorHaptic } = useHaptics()
    const [pin, setPin] = useState('')
    const inputRef = useRef<InputRef>(null)

    const isInLoadingState = isLoading

    // `translateX` rather than `left`, so the shake can run on the native driver.
    const shakeAnimation = useRef(new Animated.Value(0)).current

    const startShakeAnimation = useCallback(() => {
      errorHaptic()
      Animated.sequence(
        [10, -7.5, 5, -2.5, 0].map((toValue) =>
          Animated.timing(shakeAnimation, { toValue, duration: 75, useNativeDriver: true })
        )
      ).start()
    }, [shakeAnimation, errorHaptic])

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => setPin(''),
        shake: () => startShakeAnimation(),
      }),
      [startShakeAnimation]
    )

    const onPressPinNumber = withHaptics((character: PinValues) => {
      if (character === PinValues.Backspace) {
        setPin((pin) => pin.slice(0, pin.length - 1))
        return
      }

      if (character === PinValues.Empty) {
        return
      }

      if ([PinValues.Fingerprint, PinValues.FaceId].includes(character) && onBiometricsTap) {
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
    })

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
      <YStack flexGrow={1} gap="$8" jc="space-between" onPress={() => inputRef.current?.focus()}>
        <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
          <XStack justifyContent="center" gap="$2">
            {Array.from({ length: pinLength }, (_, i) => (
              <PinDot
                key={i}
                filled={!!isInLoadingState || pin[i] !== undefined}
                index={i}
                totalDots={pinLength}
                isLoading={!!isInLoadingState}
              />
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
            biometricsType={biometricsType}
          />
        )}
      </YStack>
    )
  }
)
