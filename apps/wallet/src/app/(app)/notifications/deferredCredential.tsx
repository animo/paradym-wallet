import { NotificationErrorBoundary } from '@app/features/notifications/NotificationErrorBoundary'
import { DeferredCredentialNotificationScreen } from '@app/features/receive/DeferredCredentialNotificationScreen'

export default function Screen() {
  return (
    <NotificationErrorBoundary>
      <DeferredCredentialNotificationScreen />
    </NotificationErrorBoundary>
  )
}
