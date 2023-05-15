import { QrScannerScreen } from 'app/features/scan/screen'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen />
      <QrScannerScreen />
    </>
  )
}
