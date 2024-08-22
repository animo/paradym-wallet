import { useOnboardingContext } from '@easypid/features/onboarding'
import { FlexPage, Heading, OnboardingScreensHeader, Paragraph, YStack } from '@package/ui'
import type React from 'react'
import { Alert } from 'react-native'
import Animated, { FadeIn, FadeInRight, FadeOut } from 'react-native-reanimated'

export default function OnboardingScreens() {
  const onboardingContext = useOnboardingContext()

  const onReset = () => {
    Alert.alert('Reset Onboarding', 'Are you sure you want to reset the onboarding process?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          onboardingContext.reset()
        },
      },
    ])
  }

  let page: React.JSX.Element
  if (onboardingContext.page.type === 'fullscreen') {
    page = onboardingContext.screen
  } else {
    page = (
      <FlexPage gap="$2" jc="space-between">
        <OnboardingScreensHeader progress={onboardingContext.progress} onBack={onReset} />
        <Animated.View
          key={onboardingContext.page.animationKey ?? onboardingContext.currentStep}
          entering={pageContentTransition.entering[onboardingContext.page.animation ?? 'default']}
          exiting={pageContentTransition.exiting.default}
          style={{ flexGrow: 1 }}
        >
          <YStack fg={1} gap="$6">
            <YStack gap="$3">
              <Heading variant="title">{onboardingContext.page.title}</Heading>
              {onboardingContext.page.subtitle && (
                <Paragraph color="$grey-700">{onboardingContext.page.subtitle}</Paragraph>
              )}
              {onboardingContext.page.caption && (
                <Paragraph color="$grey-700">
                  <Paragraph fontWeight="bold">Remember:</Paragraph> {onboardingContext.page.caption}
                </Paragraph>
              )}
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
    fullScreen: FadeIn.delay(300),
    delayed: FadeInRight.springify().damping(24).mass(0.8).stiffness(200).restSpeedThreshold(0.05).delay(500),
    default: FadeInRight.springify().damping(24).mass(0.8).stiffness(200).restSpeedThreshold(0.05).delay(200),
  },
  exiting: {
    default: FadeOut.duration(200),
  },
}
