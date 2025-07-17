import { defineMessage } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import { Heading, ScrollView, Stack, YStack } from '@package/ui'
import { useInboxNotifications } from '@paradym/wallet-sdk/src/hooks/useInboxNotifications'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { InboxNotificationRowCard, NoContentInbox } from '../../components'
import { useScrollViewPosition } from '../../hooks'

const notificationInboxMessages = {
  credentialOffer: defineMessage({
    id: 'notificationInbox.notificationType.credentialOffer',
    message: 'Credential offer',
  }),
  credentialOfferFromName: (name: string) =>
    defineMessage({
      id: 'notificationInbox.notificationType.credentialOfferFromName',
      message: `Credential offer from ${name}`,
    }),
  dataRequest: defineMessage({
    id: 'notificationInbox.notificationType.dataRequest',
    message: 'Data request',
  }),
  dataRequestFromName: (name: string) =>
    defineMessage({
      id: 'notificationInbox.notificationType.dataRequestFromName',
      message: `Data request from ${name}`,
    }),
}

export function NotificationInboxScreen() {
  const inboxNotifications = useInboxNotifications()
  const { top } = useSafeAreaInsets()
  const { push } = useRouter()
  const { t } = useLingui()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition(0)

  return (
    <YStack bg="$background" pt={top} height="100%" position="relative">
      <Stack mt="$7" p="$2" px="$4" border={isScrolledByOffset} borderTopWidth={0}>
        <Heading heading="h1" lineHeight={36} fontSize={36}>
          <Trans id="inbox.title" comment="Title heading for the Inbox screen">
            Inbox
          </Trans>
        </Heading>
      </Stack>
      {inboxNotifications.length === 0 ? (
        <NoContentInbox />
      ) : (
        <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle} px="$4" pt="$2">
          <YStack width="100%" overflow="hidden" g="md">
            {inboxNotifications.map((notification) => {
              const description =
                notification.type === 'CredentialRecord'
                  ? notification.contactLabel
                    ? notificationInboxMessages.credentialOfferFromName(notification.contactLabel)
                    : notificationInboxMessages.credentialOffer
                  : notification.contactLabel
                    ? notificationInboxMessages.dataRequestFromName(notification.contactLabel)
                    : notificationInboxMessages.dataRequest

              return (
                <InboxNotificationRowCard
                  key={notification.id}
                  title={notification.notificationTitle}
                  description={t(description)}
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
