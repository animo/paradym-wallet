import { NotificationErrorBoundary } from '@app/features/notifications/NotificationErrorBoundary'
import { CredentialNotificationScreen } from '@app/features/receive/OpenIdCredentialNotificationScreen'

export default function Screen() {
  return (
    <NotificationErrorBoundary>
      <CredentialNotificationScreen />
    </NotificationErrorBoundary>
  )
}
