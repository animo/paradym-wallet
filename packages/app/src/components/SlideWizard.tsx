import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { AnimatedStack, FlexPage, ProgressHeader, ScrollableStack, Stack, TwoPane, useMedia } from '@package/ui'
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
  /**
   * Wide windows show this step next to the next one, as one step. The next step then holds the buttons, and
   * continuing there runs the continue action this step registered with `setCombinedContinue`.
   */
  combineWithNext?: boolean
  // Wide windows give this step the full width without padding, and it lays out its own panes with `SlidePane`
  ownsWideLayout?: boolean
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
  stopSharingTitle: commonMessages.stopSharingTitle,
  stopSharingDescription: commonMessages.stopSharingDescription,
  stopSharingConfirm: commonMessages.stop,
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
    const media = useMedia()
    const combinedContinueRef = useRef<(() => Promise<void>) | undefined>(undefined)
    const [isContinuing, setIsContinuing] = useState(false)

    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    // A ref, not state: a slide can call `onNext` from an async handler (e.g. after a request),
    // and a closure from before the last transition ended would otherwise still see `true`.
    const isNavigating = useRef(false)
    const setIsNavigating = useCallback((value: boolean) => {
      isNavigating.current = value
    }, [])

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
            let newIndex = prev + increment
            // Going back in a wide window lands on a combined step, not on its second half
            if (increment < 0 && media.wide && steps[newIndex - 1]?.combineWithNext) newIndex -= 1
            setProgress(steps[newIndex].progress)
            return newIndex
          })
        }
      },
      [steps, media.wide]
    )

    const animateTransition = useCallback(
      (isForward: boolean, slide?: string, increment = 1) => {
        'worklet'

        const shouldNavigateToWhite = isForward && currentStepIndex + increment === steps.length && willResume

        // Fade out and translate current screen
        opacity.value = withTiming(0, { duration: FADE_OUT_DURATION, easing: EASE_OUT }, () => {
          runOnJS(scrollToTop)()
          if (!shouldNavigateToWhite) {
            runOnJS(updateStep)(isForward ? increment : -1, slide)
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
        if (isNavigating.current) return
        if (isCompleted || isError || currentStepIndex === 0 || steps[currentStepIndex].backIsCancel) {
          handleCancel()
        } else {
          setIsNavigating(true)
          direction.value = 'backward'
          animateTransition(false)
        }
      }, [
        currentStepIndex,
        animateTransition,
        direction,
        handleCancel,
        steps,
        isCompleted,
        isNavigating,
        isError,
        setIsNavigating,
      ])
    )

    const onNext = withHaptics(
      useCallback(
        (slide?: string, increment = 1) => {
          if (isNavigating.current) return
          if (currentStepIndex + increment < steps.length || willResume) {
            setIsNavigating(true)
            direction.value = 'forward'
            animateTransition(true, slide, increment)
          }
        },
        [currentStepIndex, steps.length, animateTransition, direction, isNavigating, willResume, setIsNavigating]
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

    const setCombinedContinue = useCallback((onContinue?: () => Promise<void>) => {
      combinedContinueRef.current = onContinue
    }, [])

    // Continuing from the second half of a combined step also continues the first half, and moves past both
    const onNextCombined = useCallback(
      async (slide?: string) => {
        if (isNavigating.current) return
        setIsContinuing(true)
        try {
          await combinedContinueRef.current?.()
        } finally {
          setIsContinuing(false)
        }
        onNext(slide, 2)
      },
      [onNext]
    )

    const Screen = isError && errorScreen ? errorScreen : steps[currentStepIndex].screen
    const isCombined =
      media.wide &&
      !(isError && errorScreen) &&
      !!steps[currentStepIndex].combineWithNext &&
      currentStepIndex < steps.length - 1
    const NextScreen = isCombined ? steps[currentStepIndex + 1].screen : undefined
    const isOwnWideLayout =
      media.wide && !(isError && errorScreen) && !!steps[currentStepIndex].ownsWideLayout && !isCombined
    const { t } = useLingui()
    const contextValue = {
      onNext,
      onBack,
      onCancel: handleCancel,
      completeProgressBar,
      ownsWideLayout: isOwnWideLayout,
    }

    const renderScreen = (PaneScreen: SlideStep['screen']) =>
      typeof PaneScreen === 'function' ? <PaneScreen /> : PaneScreen

    return (
      <WizardProvider value={contextValue}>
        <FlexPage
          safeArea={['t', 'l', 'r']}
          p="0"
          jc="space-between"
          gap="0"
          background="background"
          {...((isCombined || isOwnWideLayout) && { maxWidth: '100%' })}
        >
          <Stack px="4" pb="2" bbw={1} borderColor={isScrolledByOffset ? 'grey-100' : 'background'}>
            <ProgressHeader
              progress={isCompleted || isError ? 100 : isCombined ? steps[currentStepIndex + 1].progress : progress}
              onBack={onBack}
              onCancel={handleCancel}
              color={isError ? 'danger' : 'primary'}
            />
          </Stack>
          <AnimatedStack style={animatedStyles} f={1} pos="relative" jc="space-between">
            {isCombined && NextScreen ? (
              <TwoPane
                start={
                  <WizardProvider value={{ ...contextValue, isCombined: true, setCombinedContinue }}>
                    <SlidePane>{renderScreen(Screen)}</SlidePane>
                  </WizardProvider>
                }
                end={
                  <WizardProvider
                    value={{ ...contextValue, onNext: onNextCombined, isContinuing, isNextToPrevious: true }}
                  >
                    <SlidePane>{renderScreen(NextScreen)}</SlidePane>
                  </WizardProvider>
                }
              />
            ) : (
              // Also for a step that owns its wide layout, so folding the device doesn't remount the step and lose
              // its state. Its panes scroll themselves.
              <ScrollableStack
                scrollViewProps={{
                  // @ts-expect-error
                  ref: scrollViewRef,
                  onScroll: handleScroll,
                  scrollEventThrottle,
                  onContentSizeChange,
                  onLayout,
                  scrollEnabled: !isOwnWideLayout,
                  contentContainerStyle: isOwnWideLayout
                    ? { flex: 1 }
                    : { flexGrow: 1, paddingBottom: Math.max(bottom, 16) },
                }}
                fg={1}
                px={isOwnWideLayout ? '0' : '4'}
              >
                {renderScreen(Screen)}
              </ScrollableStack>
            )}
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

// One pane of a step in a wide window, with the padding and scrolling a step gets in a narrow window
export function SlidePane({ children }: { children: React.ReactNode }) {
  const { bottom } = useSafeAreaInsets()

  return (
    <ScrollableStack
      scrollViewProps={{ contentContainerStyle: { flexGrow: 1, paddingBottom: Math.max(bottom, 16) } }}
      fg={1}
      px="4"
    >
      {children}
    </ScrollableStack>
  )
}
