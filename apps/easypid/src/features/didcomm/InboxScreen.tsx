import { Trans, useLingui } from '@lingui/react/macro'
import { InboxNotificationRowCard, TextBackButton, useScrollViewPosition } from '@package/app'
import { AnimatedStack, FlexPage, HeaderContainer, Heading, Paragraph, ScrollView, YStack } from '@package/ui'
import { useInboxNotifications } from '@paradym/wallet-sdk/src/hooks/useInboxNotifications'
import { useRouter } from 'expo-router'
import { FadeInDown } from 'react-native-reanimated'

export function InboxScreen() {
  const inboxNotifications = useInboxNotifications()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition(0)
  const { push } = useRouter()
  const { t } = useLingui()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer
        title={t({
          id: 'inbox.header',
          message: 'Inbox',
          comment: 'Header title for the inbox screen',
        })}
        isScrolledByOffset={isScrolledByOffset}
      />
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {inboxNotifications.length === 0 ? (
          <AnimatedStack
            flexDirection="column"
            entering={FadeInDown.delay(300).springify().mass(1).damping(16).stiffness(140).restSpeedThreshold(0.1)}
            gap="$2"
            jc="center"
            p="$4"
            fg={1}
          >
            <Heading ta="center" heading="h3" fontWeight="$semiBold">
              <Trans id="inbox.emptyTitle" comment="Heading shown when the inbox is empty">
                You're all caught up
              </Trans>
            </Heading>
            <Paragraph ta="center">
              <Trans id="inbox.emptyMessage" comment="Paragraph shown when the inbox is empty">
                You don't have any notifications at the moment.
              </Trans>
            </Paragraph>
          </AnimatedStack>
        ) : (
          <YStack overflow="hidden" px="$4" gap="$4">
            {inboxNotifications.map((notification) => {
              const baseLabel =
                notification.type === 'CredentialRecord'
                  ? t({
                      id: 'inbox.notificationType.card',
                      message: 'Card',
                      comment: 'Label for a notification about a received credential',
                    })
                  : t({
                      id: 'inbox.notificationType.request',
                      message: 'Request',
                      comment: 'Label for a notification about a proof request',
                    })

              const description = notification.contactLabel
                ? t({
                    id: 'inbox.notificationType.fromLabel',
                    message: `${baseLabel} from ${notification.contactLabel}`,
                    comment: 'Label like "Card from X" or "Request from Y"',
                  })
                : baseLabel

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
                          navigationType: 'inbox',
                        },
                      })
                    } else {
                      push({
                        pathname: '/notifications/didcomm',
                        params: {
                          proofExchangeId: notification.id,
                          navigationType: 'inbox',
                        },
                      })
                    }
                  }}
                />
              )
            })}
          </YStack>
        )}
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
