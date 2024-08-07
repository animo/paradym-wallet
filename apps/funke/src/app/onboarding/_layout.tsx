import { Slot, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useResetWalletDevMenu } from '../../utils/resetWallet'

export default function RootLayout() {
  useResetWalletDevMenu()

  // TODO: where to put this?
  // void SplashScreen.hideAsync()

  return <Slot />
}
