import { NfcCard, NfcHand, NfcScannerModalAndroid, Stack, YStack, ZStack } from '@package/ui'

import { useEffect } from 'react'
import { Platform } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

interface OnboardingIdCardScanProps {
  isCardAttached?: boolean
  scanningState: 'readyToScan' | 'scanning' | 'complete' | 'error'
  progress: number
  showScanModal: boolean
  onCancel: () => void
}

// @TimoGlastra
// TODO: We can just remove this screen as all the instructions are in the smaller scanning modal that is overlayed.
// So just have everything in the id-card-start-scan screen.
// I tried removing it but it's a bit hard to understand the scanning logic.

export function OnboardingIdCardScan({
  progress,
  scanningState,
  isCardAttached,
  onCancel,
  showScanModal,
}: OnboardingIdCardScanProps) {
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
    <>
      <Stack flex-1>
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
        {/* This is here to have the same layout as id-card-start-scan */}
        <Stack flex-1 />
      </Stack>
      {Platform.OS === 'android' && (
        <NfcScannerModalAndroid
          onCancel={onCancel}
          open={showScanModal}
          progress={progress}
          scanningState={scanningState === 'scanning' && !isCardAttached ? 'readyToScan' : scanningState}
        />
      )}
    </>
  )
}
