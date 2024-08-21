import { Button, Stack, YStack, ZStack } from '@package/ui'

import { NfcCard, NfcHand } from '@package/ui'
import { useEffect } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
  withSequence,
} from 'react-native-reanimated'

interface OnboardingIdCardStartScanProps {
  goToNextStep: () => void
}

export function OnboardingIdCardStartScan({ goToNextStep }: OnboardingIdCardStartScanProps) {
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
    <Stack fg={1}>
      <YStack ai="center" w="45%">
        <ZStack mt="$6" jc="center" ai="center">
          <Stack mt="$10">
            <NfcHand height={256} width={256} />
          </Stack>
          <Animated.View style={animatedStyle}>
            <Stack mt="$-10" mx="$6">
              <NfcCard height={100} width={100} />
            </Stack>
          </Animated.View>
        </ZStack>
      </YStack>
      <Stack flex-1 justifyContent="flex-end">
        <Button.Solid onPress={goToNextStep}>Start scanning</Button.Solid>
      </Stack>
    </Stack>
  )
}
