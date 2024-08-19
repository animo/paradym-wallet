import { useEffect } from 'react'
import Reanimated, {
  useSharedValue,
  withSequence,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  useAnimatedStyle,
  FadeOut,
  FadeIn,
  cancelAnimation,
} from 'react-native-reanimated'
import { HeroIcons } from '../content/Icon'

export function AnimatedNfcScanIcon({
  icon,
  scanAnimated = true,
}: { icon: 'complete' | 'error' | 'scan'; scanAnimated?: boolean }) {
  const translateX = useSharedValue(-100)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: 108,
      height: 108,
    }
  }, [translateX])

  useEffect(() => {
    // Cancel current one when it changes
    cancelAnimation(translateX)

    if (icon === 'scan' && scanAnimated) {
      translateX.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1000, easing: Easing.ease }), // move to the right
          withDelay(2000, withTiming(-100, { duration: 0 })), // 2 seconds rest, then reset to original position instantly
          withTiming(-100, { duration: 400 }) // 400ms rest
        ),
        -1,
        false
      )
    } else {
      translateX.value = withTiming(0, { duration: 500, easing: Easing.ease })
    }
  }, [icon, scanAnimated, translateX])

  return (
    <Reanimated.View
      key={icon}
      style={{ justifyContent: 'center', alignItems: 'center' }}
      entering={FadeIn}
      exiting={FadeOut}
    >
      {icon === 'scan' && <HeroIcons.CreditCard position="absolute" color="$primary-500" size={72} fill="white" />}
      {icon === 'scan' && (
        <Reanimated.View style={animatedStyle}>
          <HeroIcons.DevicePhoneMobile position="absolute" fill="white" color="$primary-500" size={108} />
        </Reanimated.View>
      )}

      {icon === 'complete' && <HeroIcons.CheckCircle size={108} color="$positive-500" />}
      {icon === 'error' && <HeroIcons.XCircle size={108} color="$danger-500" />}
    </Reanimated.View>
  )
}
