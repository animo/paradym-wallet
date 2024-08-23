import { OnboardingContextProvider } from '@easypid/features/onboarding'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useResetWalletDevMenu } from '../../utils/resetWallet'

export default function RootLayout() {
  useResetWalletDevMenu()

  void SplashScreen.hideAsync()

  return (
    <OnboardingContextProvider>
      <Slot />
    </OnboardingContextProvider>
  )
}
