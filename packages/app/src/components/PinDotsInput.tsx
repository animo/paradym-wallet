import { XStack, YStack } from '@package/ui/base/Stacks'
import { PinPad, PinValues } from '@package/ui/components/PinPad'
import {
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
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

// One full pass of the loading animation: a dot rises, falls, and the row rests before the next.
const BOUNCE_CYCLE_MS = 900
const BOUNCE_TRAVEL_MS = 400
const BOUNCE_STAGGER_MS = 500
const BOUNCE_HEIGHT = -10

/**
 * The bounce as a curve over one cycle of a linear 0..1 driver, rather than as a sequence of steps.
 *
 * `Animated.sequence` chains its steps with a JS callback per step, and `Animated.delay` is hardcoded
 * to `useNativeDriver: false`, so the old sequence-of-timings needed the JS thread at every leg
 * boundary even though each leg itself was native. Unlocking blocks that thread for as long as the
 * Argon2 key derivation runs, which is exactly when this animation plays — so the dots froze
 * mid-bounce. `Animated.loop` around a single native timing is driven entirely natively
 * (`_startNativeLoop`), and interpolation is evaluated natively too, so nothing here needs JS once
 * it has started.
 *
 * Reanimated would express this far more directly, but the credential request UI renders this
 * component and its bundle cannot link Reanimated — see `dcApiIncludedPackages`.
 */
function getBounceInterpolation(index: number, totalDots: number) {
  const start = (index * (BOUNCE_STAGGER_MS / totalDots)) / BOUNCE_CYCLE_MS
  const travel = BOUNCE_TRAVEL_MS / BOUNCE_CYCLE_MS

  // Sampled rather than eased, because interpolation is linear between points: a cosine is the
  // shape `Easing.bezier(0.42, 0, 0.58, 1)` drew across the up and down legs.
  const samples = 8
  const inputRange: number[] = []
  const outputRange: number[] = []

  if (start > 0) {
    inputRange.push(0)
    outputRange.push(0)
  }

  for (let i = 0; i <= samples; i++) {
    inputRange.push(start + travel * (i / samples))
    outputRange.push((BOUNCE_HEIGHT * (1 - Math.cos((2 * Math.PI * i) / samples))) / 2)
  }

  inputRange.push(1)
  outputRange.push(0)

  return { inputRange, outputRange }
}

interface PinDotProps {
  filled: boolean
  index: number
  totalDots: number
  progress: Animated.Value
}

const PinDot = ({ filled, index, totalDots, progress }: PinDotProps) => {
  const translateY = useMemo(
    () => progress.interpolate(getBounceInterpolation(index, totalDots)),
    [progress, index, totalDots]
  )

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
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

    // One linear driver for every dot, looped natively. Each dot reads its own slice of it, so the
    // stagger costs nothing extra and the row keeps animating while the JS thread derives the key.
    const bounceProgress = useRef(new Animated.Value(0)).current

    useEffect(() => {
      if (!isLoading) {
        bounceProgress.setValue(0)
        return
      }

      const bounce = Animated.loop(
        Animated.timing(bounceProgress, {
          toValue: 1,
          duration: BOUNCE_CYCLE_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )

      bounce.start()

      return () => {
        bounce.stop()
        bounceProgress.setValue(0)
      }
    }, [isLoading, bounceProgress])

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
                progress={bounceProgress}
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
