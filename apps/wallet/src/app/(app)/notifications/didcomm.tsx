import { DidCommNotificationScreen } from '@app/features/didcomm/DidCommNotificationScreen'
import { NotificationErrorBoundary } from '@app/features/notifications/NotificationErrorBoundary'

export default function Screen() {
  return (
    <NotificationErrorBoundary>
      <DidCommNotificationScreen />
    </NotificationErrorBoundary>
  )
}
