import { Slot } from 'expo-router'
import { useResetWalletDevMenu } from '../../utils/resetWallet'

export default function RootLayout() {
  useResetWalletDevMenu()

  return <Slot />
}
