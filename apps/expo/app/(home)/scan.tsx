import { QrScannerScreen } from 'app/features/scan/ScanScreen'
import { StatusBar } from 'expo-status-bar'

export default function Screen() {
  return (
    <>
      <StatusBar style="light" />
      <QrScannerScreen />
    </>
  )
}
