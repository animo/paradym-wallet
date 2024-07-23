import { useInboxNotifications } from '@package/agent'
import { ScrollView, YStack } from '@package/ui'
import { useRouter } from 'solito/router'

import { InboxNotificationRowCard, NoContentInbox } from '../../components'

export function NotificationInboxScreen() {
  const inboxNotifications = useInboxNotifications()
  const { push } = useRouter()

  return (
    <YStack bg="$background" height="100%" position="relative">
      {inboxNotifications.length === 0 ? (
        <NoContentInbox />
      ) : (
        <ScrollView px="$4" pt="$2">
          <YStack width="100%" overflow="hidden" g="md">
            {inboxNotifications.map((notification) => {
              let description = `${notification.type === 'CredentialRecord' ? 'Credential offer' : 'Data request'}`
              if (notification.contactLabel) {
                description += ` from ${notification.contactLabel}`
              }

              return (
                <InboxNotificationRowCard
                  key={notification.id}
                  title={notification.notificationTitle}
                  description={description}
                  onPress={() => {
                    if (notification.type === 'CredentialRecord') {
                      push({
                        pathname: '/notifications/didcomm',
                        query: {
                          credentialExchangeId: notification.id,
                        },
                      })
                    } else {
                      push({
                        pathname: '/notifications/didcomm',
                        query: {
                          proofExchangeId: notification.id,
                        },
                      })
                    }
                  }}
                />
              )
            })}
          </YStack>
        </ScrollView>
      )}
    </YStack>
  )
}
