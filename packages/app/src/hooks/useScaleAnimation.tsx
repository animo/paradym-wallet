import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

export function useScaleAnimation({
  scaleInValue = 0.98,
  duration = 100,
}: { scaleInValue?: number; duration?: number } = {}) {
  const scale = useSharedValue(1)

  const pressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  })

  const handlePressIn = () => {
    scale.value = withTiming(scaleInValue, { duration })
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: duration / 2 })
  }

  return { pressStyle, handlePressIn, handlePressOut }
}
