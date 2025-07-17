import { Heading, ScrollView, Stack, YStack } from '@package/ui'
import { useInboxNotifications } from '@paradym/wallet-sdk/src/hooks/useInboxNotifications'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { InboxNotificationRowCard, NoContentInbox } from '../../components'
import { useScrollViewPosition } from '../../hooks'

export function NotificationInboxScreen() {
  const inboxNotifications = useInboxNotifications()
  const { top } = useSafeAreaInsets()
  const { push } = useRouter()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition(0)

  return (
    <YStack bg="$background" pt={top} height="100%" position="relative">
      <Stack mt="$7" p="$2" px="$4" border={isScrolledByOffset} borderTopWidth={0}>
        <Heading variant="h1" lineHeight={36} fontSize={36}>
          Inbox
        </Heading>
      </Stack>
      {inboxNotifications.length === 0 ? (
        <NoContentInbox />
      ) : (
        <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle} px="$4" pt="$2">
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
                        params: {
                          credentialExchangeId: notification.id,
                        },
                      })
                    } else {
                      push({
                        pathname: '/notifications/didcomm',
                        params: {
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
