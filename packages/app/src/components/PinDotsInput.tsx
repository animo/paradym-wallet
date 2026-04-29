import { PinPad, PinValues, XStack, YStack } from '@package/ui'
import { type ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Animated, {
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Circle, Input } from 'tamagui'
import { useHaptics } from '../hooks'

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

function usePinDotsAnimationState({
  pinLength,
  pin,
  isLoading,
}: {
  pinLength: number
  pin: string
  isLoading: boolean | undefined
}) {
  const { errorHaptic } = useHaptics()
  const filledDots = new Array(pinLength).fill(0).map((_, i) => isLoading || pin[i] !== undefined)
  const translationAnimations = filledDots.map(() => useSharedValue(0))
  const shakeAnimation = useSharedValue(0)

  const shake = useCallback(() => {
    errorHaptic()
    shakeAnimation.value = withRepeat(
      withSequence(...[10, -7.5, 5, -2.5, 0].map((toValue) => withTiming(toValue, { duration: 75 }))),
      1,
      true
    )
  }, [errorHaptic, shakeAnimation])

  useEffect(() => {
    translationAnimations.forEach((animation, index) => {
      if (!isLoading) {
        animation.value = withTiming(0, { duration: 75 })
        return
      }

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
  }, [isLoading, ...translationAnimations])

  return {
    filledDots,
    translationAnimations,
    shakeAnimation,
    shake,
  }
}

function PinDotsDisplay({ state }: { state: ReturnType<typeof usePinDotsAnimationState> }) {
  return (
    <Animated.View style={{ left: state.shakeAnimation }}>
      <XStack justifyContent="center" gap="$2">
        {state.filledDots.map((filled, i) => (
          <Animated.View key={i} style={{ transform: [{ translateY: state.translationAnimations[i] }] }}>
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
    const { withHaptics } = useHaptics()
    const [pin, setPin] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const isInLoadingState = isLoading
    const dotsState = usePinDotsAnimationState({
      pin,
      pinLength,
      isLoading,
    })

    const schedulePinComplete = useCallback(
      (completedPin: string) => {
        setTimeout(() => onPinComplete(completedPin), 100)
      },
      [onPinComplete]
    )

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => setPin(''),
        shake: () => dotsState.shake(),
      }),
      [dotsState.shake]
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
          schedulePinComplete(newPin)
        }

        return newPin
      })
    })

    const onChangePin = (newPin: string) => {
      if (isLoading) return
      const sanitized = newPin.replace(/[^0-9]/g, '')
      setPin(sanitized)

      if (sanitized.length === pinLength) {
        schedulePinComplete(sanitized)
      }
    }

    return (
      <YStack flexGrow={1} gap="$8" jc="space-between" onPress={() => inputRef.current?.focus()}>
        <PinDotsDisplay state={dotsState} />
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
            onChangeText={(e) => onChangePin(typeof e === 'string' ? e : e.nativeEvent.text)}
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
