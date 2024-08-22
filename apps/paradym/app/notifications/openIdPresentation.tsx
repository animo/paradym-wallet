import { ModalProvider, OpenIdPresentationNotificationScreen } from '@package/app'

export default function Screen() {
  return (
    <ModalProvider>
      <OpenIdPresentationNotificationScreen />
    </ModalProvider>
  )
}
