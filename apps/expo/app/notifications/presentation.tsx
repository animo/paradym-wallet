import { PresentationNotificationScreen } from 'app/features/notifications'
import { StatusBar } from 'expo-status-bar'

export default function Screen() {
  return (
    <>
      <StatusBar style="light" />
      <PresentationNotificationScreen />
    </>
  )
}
