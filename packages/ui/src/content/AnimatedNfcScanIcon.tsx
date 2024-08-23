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
} from 'react-native-reanimated'
import { HeroIcons } from '../content/Icon'
import { Stack } from '../base'

export function AnimatedNfcScanIcon({
  icon,
  scanAnimated = true,
}: { icon: 'complete' | 'error' | 'scan'; scanAnimated?: boolean }) {
  const rotation = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    }
  })

  useEffect(() => {
    rotation.value = withSequence(
      withTiming(360, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 0 }),
      withRepeat(
        withSequence(
          withDelay(500, withTiming(360, { duration: 1500, easing: Easing.inOut(Easing.ease) })),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    )
  }, [rotation])

  return (
    <Reanimated.View
      key={icon}
      style={{ justifyContent: 'center', alignItems: 'center' }}
      entering={FadeIn}
      exiting={FadeOut}
    >
      {icon === 'scan' && (
        <HeroIcons.DevicePhoneMobile position="absolute" fill="white" color="$primary-500" size={108} />
      )}
      {icon === 'scan' && (
        <Stack position="absolute" justifyContent="center" alignItems="center" width={32} height={32}>
          <Reanimated.View style={animatedStyle}>
            <HeroIcons.ArrowPath color="$primary-500" size={32} />
          </Reanimated.View>
        </Stack>
      )}

      {icon === 'complete' && <HeroIcons.CheckCircle size={108} color="$positive-500" />}
      {icon === 'error' && <HeroIcons.XCircle size={108} color="$danger-500" />}
    </Reanimated.View>
  )
}
