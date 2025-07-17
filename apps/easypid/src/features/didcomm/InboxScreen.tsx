import { InboxNotificationRowCard, TextBackButton, useScrollViewPosition } from '@package/app'
import { AnimatedStack, FlexPage, HeaderContainer, Heading, Paragraph, ScrollView, YStack } from '@package/ui'
import { useInboxNotifications } from '@paradym/wallet-sdk/src/hooks/useInboxNotifications'
import { useRouter } from 'expo-router'
import { FadeInDown } from 'react-native-reanimated'

export function InboxScreen() {
  const inboxNotifications = useInboxNotifications()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition(0)
  const { push } = useRouter()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer title="Inbox" isScrolledByOffset={isScrolledByOffset} />
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
            <Heading ta="center" variant="h3" fontWeight="$semiBold">
              You're all caught up
            </Heading>
            <Paragraph ta="center">You don't have any notifications at the moment.</Paragraph>
          </AnimatedStack>
        ) : (
          <YStack overflow="hidden" px="$4" gap="$4">
            {inboxNotifications.map((notification) => {
              let description = `${notification.type === 'CredentialRecord' ? 'Card' : 'Request'}`
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
