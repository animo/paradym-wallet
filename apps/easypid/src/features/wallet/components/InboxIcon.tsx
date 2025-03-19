import { useRouter } from 'expo-router'
import { useHasInboxNotifications } from 'packages/agent/src/hooks'
import { useHaptics } from 'packages/app/src'
import { Circle, IconContainer } from 'packages/ui/src'
import { AnimatedStack, Stack } from 'packages/ui/src/base/Stacks'
import { HeroIcons } from 'packages/ui/src/content/Icon'
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
