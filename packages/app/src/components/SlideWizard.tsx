import { AnimatedStack, FlexPage, ProgressHeader, ScrollableStack, Stack } from '@package/ui'
import * as Haptics from 'expo-haptics'
import { useCallback, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'
import { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ConfirmationSheet } from '../components/ConfirmationSheet'
import { useScrollViewPosition } from '../hooks/useScrollViewPosition'
import { WizardProvider } from './WizardContext'

export type SlideStep = {
  step: string
  progress: number
  screen: React.ReactNode
  backIsCancel?: boolean
}

type SlideWizardProps = {
  steps: SlideStep[]
  onCancel: () => void
  isError?: boolean
}

export function SlideWizard({ steps, onCancel, isError }: SlideWizardProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle, onContentSizeChange, onLayout } =
    useScrollViewPosition(0)
  const { bottom } = useSafeAreaInsets()
  const direction = useSharedValue<'forward' | 'backward'>('forward')
  const opacity = useSharedValue(1)
  const translateX = useSharedValue(0)
  const scrollViewRef = useRef<ScrollView>(null)

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const scrollToTop = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
  }, [])

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }))

  const updateStep = useCallback(
    (increment: number, slide?: string) => {
      if (slide) {
        const idx = steps.findIndex((step) => step.step === slide)
        if (idx !== -1) {
          setCurrentStepIndex(idx)
        }
      } else {
        setCurrentStepIndex((prev) => prev + increment)
      }
    },
    [steps]
  )

  const animateTransition = useCallback(
    (isForward: boolean, slide?: string) => {
      'worklet'
      const distance = 50
      const fadeOutDuration = 250
      const delay = 100
      const fadeInDuration = 250

      const easeOut = Easing.bezier(0.25, 0.1, 0.25, 1)

      // Fade out and translate current screen
      opacity.value = withTiming(0, { duration: fadeOutDuration, easing: easeOut }, () => {
        runOnJS(scrollToTop)()
        runOnJS(updateStep)(isForward ? 1 : -1, slide)
      })
      translateX.value = withTiming(isForward ? -distance : distance, { duration: fadeOutDuration, easing: easeOut })

      // After fadeOutDuration + delay, fade in and translate new screen
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: fadeInDuration, easing: easeOut })
        translateX.value = withSequence(
          withTiming(isForward ? distance : -distance, { duration: 0 }),
          withTiming(0, { duration: fadeInDuration, easing: easeOut })
        )
      }, fadeOutDuration + delay)
    },
    [opacity, translateX, updateStep, scrollToTop]
  )

  const handleCancel = useCallback(() => setIsSheetOpen(true), [])

  const onConfirmCancel = () => {
    setIsSheetOpen(false)
    onCancel()
  }

  const onBack = useCallback(() => {
    if (isCompleted || currentStepIndex === 0 || steps[currentStepIndex].backIsCancel) {
      handleCancel()
    } else {
      direction.value = 'backward'
      animateTransition(false)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [currentStepIndex, animateTransition, direction, handleCancel, steps, isCompleted])

  const onNext = useCallback(
    (slide?: string) => {
      if (currentStepIndex < steps.length - 1) {
        direction.value = 'forward'
        animateTransition(true, slide)
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    },
    [currentStepIndex, steps.length, animateTransition, direction]
  )

  const completeProgressBar = useCallback(() => {
    setIsCompleted(true)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [])

  const contextValue = { onNext, onBack, onCancel: handleCancel, completeProgressBar }

  return (
    <WizardProvider value={contextValue}>
      <FlexPage safeArea="t" p="$0" jc="space-between" gap="$0" background="$background">
        <Stack px="$4" py="$2" bbw={1} borderColor={isScrolledByOffset ? '$grey-100' : '$background'}>
          <ProgressHeader
            progress={isCompleted ? 100 : steps[currentStepIndex].progress}
            onBack={onBack}
            onCancel={() => setIsSheetOpen(true)}
            color={isError ? 'danger' : 'primary'}
          />
        </Stack>
        <AnimatedStack pos="relative" style={animatedStyles} jc="space-between" fg={1}>
          <ScrollableStack
            scrollViewProps={{
              // @ts-expect-error
              ref: scrollViewRef,
              onScroll: handleScroll,
              scrollEventThrottle,
              onContentSizeChange,
              onLayout,
              contentContainerStyle: { flexGrow: 1, paddingBottom: bottom },
            }}
            fg={1}
            px="$4"
          >
            {steps[currentStepIndex].screen}
          </ScrollableStack>
        </AnimatedStack>
      </FlexPage>
      <ConfirmationSheet isOpen={isSheetOpen} setIsOpen={setIsSheetOpen} onConfirm={onConfirmCancel} />
    </WizardProvider>
  )
}
