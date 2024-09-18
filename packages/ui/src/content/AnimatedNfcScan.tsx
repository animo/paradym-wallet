import { useEffect } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
  withSequence,
} from 'react-native-reanimated'
import { Stack, ZStack } from '../base'
import { NfcCard, NfcHand } from '../images'

export function AnimatedNfcScan() {
  const translateY = useSharedValue(0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const runAnimation = () => {
      translateY.value = withSequence(
        // Move down
        withTiming(100, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        // Wait at the bottom
        withDelay(1000, withTiming(100, { duration: 0 })),
        // Move back up
        withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) })
      )
    }

    // Start the animation
    runAnimation()

    // Set up an interval to restart the animation
    const intervalId = setInterval(runAnimation, 4000) // Total duration of one cycle

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    }
  })

  return (
    <ZStack mt="$6" jc="center" ai="center">
      <Animated.View style={animatedStyle}>
        <Stack mt="$-10" mx="$6">
          <NfcCard height={100} width={100} />
        </Stack>
      </Animated.View>
      <Stack mt="$8">
        <NfcHand height={256} width={256} />
      </Stack>
    </ZStack>
  )
}
