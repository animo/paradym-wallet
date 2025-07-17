import { useHaptics } from '@package/app'
import { AnimatedStack, Circle, IconContainer, Stack } from '@package/ui'
import { HeroIcons } from '@package/ui'
import { useHasInboxNotifications } from '@paradym/wallet-sdk/src/hooks/useHasInboxNotifications'
import { useRouter } from 'expo-router'
import { ZoomIn, ZoomOut } from 'react-native-reanimated'

export function InboxIcon() {
  const { push } = useRouter()
  const { hasInboxNotifications } = useHasInboxNotifications()
  const { withHaptics } = useHaptics()

  const pushToInbox = withHaptics(() => push('/inbox'))

  return (
    <Stack onPress={pushToInbox}>
      {hasInboxNotifications && (
        <AnimatedStack zi={5} pos="absolute" top="$-1" right="$-1" entering={ZoomIn} exiting={ZoomOut}>
          <Circle size={12} backgroundColor="$primary-500" />
        </AnimatedStack>
      )}
      <IconContainer bg="white" aria-label="Menu" icon={<HeroIcons.Bell />} onPress={pushToInbox} />
    </Stack>
  )
}
