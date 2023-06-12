import { PresentationNotificationScreen } from 'app/features/notifications'
import { StatusBar } from 'expo-status-bar'

export default function Screen() {
  return (
    <>
      {/* FIXME: iOS should set the correct colour, but it is not. So we manually overwrite it.*/}
      <StatusBar style="light" />
      <PresentationNotificationScreen />
    </>
  )
}
