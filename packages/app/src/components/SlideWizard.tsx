import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { AnimatedStack, FlexPage, ProgressHeader, ScrollableStack, Stack } from '@package/ui'
import type React from 'react'
import { type ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
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

  /**
   * If true, the wizard will only fade out and try and render the next screen
   */
  willResume?: boolean

  /**
   * If true, the wizard will start at this progress value and animate the first screen forward
   */
  resumeFrom?: number
}

const DISTANCE = 50
const FADE_OUT_DURATION = 250
const DELAY = 100
const FADE_IN_DURATION = 250
const EASE_OUT = Easing.bezier(0.25, 0.1, 0.25, 1)

const sharingMessages = {
  stopSharingTitle: defineMessage({
    id: 'slideWizard.confirmation.stopSharingTitle',
    message: 'Stop sharing?',
    comment: 'Title of confirmation dialog shown when user attempts to stop sharing data',
  }),
  stopSharingDescription: defineMessage({
    id: 'slideWizard.confirmation.stopSharingDescription',
    message: 'If you stop, no data will be shared.',
    comment: 'Description in confirmation dialog about stopping data sharing',
  }),
  stopSharingConfirm: defineMessage({
    id: 'slideWizard.confirmation.stopSharingConfirm',
    message: 'Stop',
    comment: 'Confirm button text in stop sharing confirmation dialog',
  }),
}

export interface SlideWizardRef {
  goToNextSlide: () => void
  goToSlide: (slide: string) => void
}

export const SlideWizard = forwardRef(
  (
    { steps, onCancel, isError, errorScreen, confirmation, willResume, resumeFrom }: SlideWizardProps,
    ref: ForwardedRef<SlideWizardRef>
  ) => {
    const { handleScroll, isScrolledByOffset, scrollEventThrottle, onContentSizeChange, onLayout } =
      useScrollViewPosition(0)
    const { bottom } = useSafeAreaInsets()
    const direction = useSharedValue<'forward' | 'backward'>('forward')
    const opacity = useSharedValue(resumeFrom ? 0 : 1)
    const translateX = useSharedValue(0)
    const scrollViewRef = useRef<ScrollView>(null)
    const { withHaptics } = useHaptics()

    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isNavigating, setIsNavigating] = useState(false)

    const [progress, setProgress] = useState(steps[currentStepIndex].progress)

    useEffect(() => {
      if (resumeFrom) {
        // Make it start from the resumeFrom value
        setProgress(resumeFrom)
        // Then update the progress to the current step value to make it animate
        setTimeout(() => {
          setProgress(steps[currentStepIndex].progress)
        }, 1)

        // Match the enter animation from animateTransition
        translateX.value = DISTANCE
        opacity.value = withTiming(1, { duration: FADE_IN_DURATION, easing: EASE_OUT })
        translateX.value = withTiming(0, { duration: FADE_IN_DURATION, easing: EASE_OUT }, () => {
          runOnJS(setIsNavigating)(false)
        })
      }
    }, [])

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
            setProgress(steps[idx].progress)
          }
        } else {
          setCurrentStepIndex((prev) => {
            const newIndex = prev + increment
            setProgress(steps[newIndex].progress)
            return newIndex
          })
        }
      },
      [steps]
    )

    const animateTransition = useCallback(
      (isForward: boolean, slide?: string) => {
        'worklet'

        const shouldNavigateToWhite = isForward && currentStepIndex + 1 === steps.length && willResume

        // Fade out and translate current screen
        opacity.value = withTiming(0, { duration: FADE_OUT_DURATION, easing: EASE_OUT }, () => {
          runOnJS(scrollToTop)()
          if (!shouldNavigateToWhite) {
            runOnJS(updateStep)(isForward ? 1 : -1, slide)
          }
        })
        translateX.value = withTiming(isForward ? -DISTANCE : DISTANCE, {
          duration: FADE_OUT_DURATION,
          easing: EASE_OUT,
        })

        // After fadeOutDuration + delay, fade in and translate new screen
        if (!shouldNavigateToWhite) {
          setTimeout(() => {
            opacity.value = withTiming(1, { duration: FADE_IN_DURATION, easing: EASE_OUT })
            translateX.value = withSequence(
              withTiming(isForward ? DISTANCE : -DISTANCE, { duration: 0 }),
              withTiming(0, { duration: FADE_IN_DURATION, easing: EASE_OUT }, () => {
                // Reset navigation state
                runOnJS(setIsNavigating)(false)
              })
            )
          }, FADE_OUT_DURATION + DELAY)
        }
      },
      [opacity, translateX, updateStep, scrollToTop, currentStepIndex, steps.length, willResume]
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
          if (currentStepIndex < steps.length - 1 || willResume) {
            setIsNavigating(true)
            direction.value = 'forward'
            animateTransition(true, slide)
          }
        },
        [currentStepIndex, steps.length, animateTransition, direction, isNavigating, willResume]
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
    const { t } = useLingui()

    return (
      <WizardProvider value={contextValue}>
        <FlexPage safeArea="t" p="$0" jc="space-between" gap="$0" background="$background">
          <Stack px="$4" pb="$2" bbw={1} borderColor={isScrolledByOffset ? '$grey-100' : '$background'}>
            <ProgressHeader
              progress={isCompleted || isError ? 100 : progress}
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
          title={confirmation?.title ?? t(sharingMessages.stopSharingTitle)}
          description={confirmation?.description ?? t(sharingMessages.stopSharingDescription)}
          confirmText={confirmation?.confirmText ?? t(sharingMessages.stopSharingConfirm)}
          isOpen={isSheetOpen}
          setIsOpen={setIsSheetOpen}
          onConfirm={onConfirmCancel}
        />
      </WizardProvider>
    )
  }
)
