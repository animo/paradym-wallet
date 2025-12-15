import { useSecureUnlock } from '@easypid/agent'
import { useHasFinishedOnboarding, useOnboardingContext } from '@easypid/features/onboarding'
import { useLingui } from '@lingui/react/macro'
import { useHaptics } from '@package/app'
import { commonMessages } from '@package/translations'
import { AnimatedStack, FlexPage, Heading, Paragraph, ProgressHeader, useMedia, YStack } from '@package/ui'
import { router, useLocalSearchParams } from 'expo-router'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Alert, findNodeHandle } from 'react-native'
import Animated, { FadeIn, FadeInRight, FadeOut } from 'react-native-reanimated'
import { resetWallet } from '../../utils/resetWallet'

export default function OnboardingScreens() {
  const { withHaptics } = useHaptics()
  const media = useMedia()
  const [hasFinishedOnboarding] = useHasFinishedOnboarding()
  const onboardingContext = useOnboardingContext()
  const secureUnlock = useSecureUnlock()
  const headerRef = useRef(null)
  const reset = useLocalSearchParams<{ reset?: 'true' }>().reset === 'true'
  const [hasResetWallet, setHasResetWallet] = useState(false)
  const { t } = useLingui()
  useEffect(() => {
    if (headerRef.current) {
      const handle = findNodeHandle(headerRef.current)
      if (handle) {
        AccessibilityInfo.setAccessibilityFocus(handle)
      }
    }
  }, [onboardingContext.currentStep])

  if (!reset && hasResetWallet) {
    setHasResetWallet(false)
  }

  useEffect(() => {
    if (!reset || hasResetWallet) return

    setHasResetWallet(true)
    router.setParams({ reset: 'false' })
    resetWallet(secureUnlock)
  }, [reset, secureUnlock, hasResetWallet])

  const resetAlertTitle = t({
    id: 'onboarding.resetAlert.title',
    message: 'Reset Onboarding',
    comment: 'Title of the alert when user attempts to reset onboarding',
  })
  const resetAlertMessage = t({
    id: 'onboarding.resetAlert.message',
    message: 'Are you sure you want to reset the onboarding process?',
    comment: 'Confirmation message for onboarding reset',
  })
  const cancelMessage = t(commonMessages.cancel)
  const yesMessage = t(commonMessages.yes)

  const onReset = withHaptics(() => {
    Alert.alert(resetAlertTitle, resetAlertMessage, [
      {
        text: cancelMessage,
        style: 'cancel',
      },
      {
        text: yesMessage,
        onPress: withHaptics(() => {
          onboardingContext.reset()
        }),
      },
    ])
  })

  if (hasFinishedOnboarding) return null

  let page: React.JSX.Element
  if (onboardingContext.page.type === 'fullscreen') {
    page = onboardingContext.screen
  } else {
    page = (
      <FlexPage gap="$2" jc="space-between" bg="$background">
        <AnimatedStack entering={FadeIn.delay(300)}>
          <ProgressHeader enterAnimation progress={onboardingContext.progress} onBack={onReset} />
        </AnimatedStack>

        <Animated.View
          key={onboardingContext.page.animationKey ?? onboardingContext.currentStep}
          entering={pageContentTransition.entering[onboardingContext.page.animation ?? 'default']}
          exiting={pageContentTransition.exiting.default}
          style={{ flexGrow: 1 }}
        >
          <YStack fg={1} gap={media.short ? '$5' : '$6'}>
            <YStack gap={media.short ? '$2' : '$3'}>
              {onboardingContext.page.title && (
                <Heading ref={headerRef} heading="h1">
                  {t(onboardingContext.page.title)}
                </Heading>
              )}
              {onboardingContext.page.subtitle && <Paragraph>{t(onboardingContext.page.subtitle)}</Paragraph>}
            </YStack>
            {onboardingContext.screen}
          </YStack>
        </Animated.View>
      </FlexPage>
    )
  }

  return (
    <Animated.View
      // for full screen, we want to animate the page transitions. For others we don't want to animate the static layout for every page change
      key={onboardingContext.page.type === 'fullscreen' ? onboardingContext.currentStep : onboardingContext.page.type}
      style={{ flex: 1 }}
      entering={pageContentTransition.entering.fullScreen}
      exiting={pageContentTransition.exiting.default}
    >
      {page}
    </Animated.View>
  )
}

const pageContentTransition = {
  entering: {
    fullScreen: FadeIn.duration(0),
    delayed: FadeInRight.springify().damping(24).mass(0.8).stiffness(200).restSpeedThreshold(0.05).delay(500),
    default: FadeInRight.springify().damping(24).mass(0.8).stiffness(200).restSpeedThreshold(0.05).delay(200),
  },
  exiting: {
    default: FadeOut.duration(200),
  },
}
