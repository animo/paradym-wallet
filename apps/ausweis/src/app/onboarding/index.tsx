import { useOnboardingContext } from '@ausweis/features/onboarding'
import { FlexPage, OnboardingScreensHeader } from '@package/ui'
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated'

export default function OnboardingScreens() {
  const onboardingContext = useOnboardingContext()

  let page: React.JSX.Element
  if (onboardingContext.page.type === 'fullscreen') {
    page = onboardingContext.screen
  } else {
    page = (
      <FlexPage gap="$0">
        <OnboardingScreensHeader
          flex={1}
          progress={onboardingContext.progress}
          title={onboardingContext.page.title}
          subtitle={onboardingContext.page.subtitle}
        />
        <Animated.View
          key={onboardingContext.page.animationKey ?? onboardingContext.currentStep}
          style={{ flex: 3 }}
          entering={FadeInRight}
          exiting={FadeOutLeft}
        >
          {onboardingContext.screen}
        </Animated.View>
      </FlexPage>
    )
  }

  return (
    <Animated.View
      // for full screen, we want to animate the page transitions. For others we don't want to animate the static layout for every page change
      key={onboardingContext.page.type === 'fullscreen' ? onboardingContext.currentStep : onboardingContext.page.type}
      style={{ flex: 1 }}
      entering={FadeInRight}
      exiting={FadeOutLeft}
    >
      {page}
    </Animated.View>
  )
}
