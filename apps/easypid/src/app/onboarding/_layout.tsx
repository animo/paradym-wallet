import { OnboardingContextProvider } from '@easypid/features/onboarding'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'

export default function RootLayout() {
  void SplashScreen.hideAsync()

  return (
    <OnboardingContextProvider>
      <Slot />
    </OnboardingContextProvider>
  )
}
