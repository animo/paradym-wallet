import { DidCommNotificationScreen, ModalProvider } from '@package/app'

export default function Screen() {
  return (
    <ModalProvider>
      <DidCommNotificationScreen />
    </ModalProvider>
  )
}
