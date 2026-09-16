import { NotificationErrorBoundary } from '@app/features/notifications/NotificationErrorBoundary'
import { OpenIdPresentationNotificationScreen } from '@app/features/share/OpenIdPresentationNotificationScreen'

export default function Screen() {
  return (
    <NotificationErrorBoundary>
      <OpenIdPresentationNotificationScreen />
    </NotificationErrorBoundary>
  )
}
