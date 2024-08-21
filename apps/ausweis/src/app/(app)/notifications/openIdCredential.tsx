import { ModalProvider, OpenIdCredentialNotificationScreen } from '@package/app'

export default function Screen() {
  return (
    <ModalProvider>
      <OpenIdCredentialNotificationScreen />
    </ModalProvider>
  )
}
