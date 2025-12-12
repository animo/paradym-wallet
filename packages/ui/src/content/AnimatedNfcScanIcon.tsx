import { useEffect } from 'react'
import Reanimated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Stack } from '../base'
import { HeroIcons } from '../content/Icon'

export function AnimatedNfcScanIcon({ icon }: { icon: 'complete' | 'error' | 'scan' }) {
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
