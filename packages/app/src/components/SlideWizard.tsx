import { AnimatedStack, FlexPage, ProgressHeader, ScrollableStack, Stack } from '@package/ui'
import type React from 'react'
import { type ForwardedRef, forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { Keyboard, type ScrollView } from 'react-native'
import { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ConfirmationSheet } from '../components/ConfirmationSheet'
import { useHaptics } from '../hooks/useHaptics'
import { useScrollViewPosition } from '../hooks/useScrollViewPosition'
import { WizardProvider } from './WizardContext'

export type SlideStep = {
  step: string
  progress: number
  screen: (() => React.ReactNode) | React.ReactElement
  backIsCancel?: boolean
}

type SlideWizardProps = {
  steps: SlideStep[]
  errorScreen?: () => React.ReactNode
  onCancel: () => void
  isError?: boolean
  confirmation?: {
    title: string
    description: string
    confirmText?: string
  }
}

export interface SlideWizardRef {
  goToNextSlide: () => void
  goToSlide: (slide: string) => void
}

export const SlideWizard = forwardRef(
  ({ steps, onCancel, isError, errorScreen, confirmation }: SlideWizardProps, ref: ForwardedRef<SlideWizardRef>) => {
    const { handleScroll, isScrolledByOffset, scrollEventThrottle, onContentSizeChange, onLayout } =
      useScrollViewPosition(0)
    const { bottom } = useSafeAreaInsets()
    const direction = useSharedValue<'forward' | 'backward'>('forward')
    const opacity = useSharedValue(1)
    const translateX = useSharedValue(0)
    const scrollViewRef = useRef<ScrollView>(null)
    const { withHaptics } = useHaptics()

    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)

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
            withTiming(0, { duration: fadeInDuration, easing: easeOut }, () => {
              // Reset navigation state
              runOnJS(setIsNavigating)(false)
            })
          )
        }, fadeOutDuration + delay)
      },
      [opacity, translateX, updateStep, scrollToTop]
    )

    const handleCancel = withHaptics(
      useCallback(() => {
        Keyboard.dismiss()
        setIsSheetOpen(true)
      }, [])
    )

    const onConfirmCancel = withHaptics(() => {
      setIsSheetOpen(false)
      onCancel()
    })

    const onBack = withHaptics(
      useCallback(() => {
        if (isNavigating) return
        if (isCompleted || isError || currentStepIndex === 0 || steps[currentStepIndex].backIsCancel) {
          handleCancel()
        } else {
          setIsNavigating(true)
          direction.value = 'backward'
          animateTransition(false)
        }
      }, [currentStepIndex, animateTransition, direction, handleCancel, steps, isCompleted, isNavigating, isError])
    )

    const onNext = withHaptics(
      useCallback(
        (slide?: string) => {
          if (isNavigating) return
          if (currentStepIndex < steps.length - 1) {
            setIsNavigating(true)
            direction.value = 'forward'
            animateTransition(true, slide)
          }
        },
        [currentStepIndex, steps.length, animateTransition, direction, isNavigating]
      )
    )

    useImperativeHandle(
      ref,
      () => ({
        goToNextSlide: () => onNext(),
        goToSlide: (slide) => onNext(slide),
      }),
      [onNext]
    )

    const completeProgressBar = withHaptics(
      useCallback(() => {
        setIsCompleted(true)
      }, [])
    )

    const contextValue = { onNext, onBack, onCancel: handleCancel, completeProgressBar }
    const Screen = isError && errorScreen ? errorScreen : steps[currentStepIndex].screen

    return (
      <WizardProvider value={contextValue}>
        <FlexPage safeArea="t" p="$0" jc="space-between" gap="$0" background="$background">
          <Stack px="$4" pb="$2" bbw={1} borderColor={isScrolledByOffset ? '$grey-100' : '$background'}>
            <ProgressHeader
              progress={isCompleted || isError ? 100 : steps[currentStepIndex].progress}
              onBack={onBack}
              onCancel={handleCancel}
              color={isError ? 'danger' : 'primary'}
            />
          </Stack>
          <AnimatedStack style={animatedStyles} fg={1} pos="relative" jc="space-between">
            <ScrollableStack
              scrollViewProps={{
                // @ts-expect-error
                ref: scrollViewRef,
                onScroll: handleScroll,
                scrollEventThrottle,
                onContentSizeChange,
                onLayout,
                contentContainerStyle: { flexGrow: 1, paddingBottom: Math.max(bottom, 16) },
              }}
              fg={1}
              px="$4"
            >
              {typeof Screen === 'function' ? <Screen /> : Screen}
            </ScrollableStack>
          </AnimatedStack>
        </FlexPage>
        <ConfirmationSheet
          type="floating"
          title={confirmation?.title ?? 'Stop sharing?'}
          description={confirmation?.description ?? 'If you stop, no data will be shared.'}
          confirmText={confirmation?.confirmText}
          isOpen={isSheetOpen}
          setIsOpen={setIsSheetOpen}
          onConfirm={onConfirmCancel}
        />
      </WizardProvider>
    )
  }
)
