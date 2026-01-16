import { useLingui } from '@lingui/react/macro'
import { useHaptics } from '@package/app'
import { AnimatedStack, Circle, HeroIcons, IconContainer, Stack } from '@package/ui'
import { useHasInboxNotifications } from '@paradym/wallet-sdk/hooks'
import { useRouter } from 'expo-router'
import { ZoomIn, ZoomOut } from 'react-native-reanimated'

export function InboxIcon() {
  const { push } = useRouter()
  const { hasInboxNotifications } = useHasInboxNotifications()
  const { withHaptics } = useHaptics()
  const { t } = useLingui()

  const pushToInbox = withHaptics(() => push('/inbox'))

  const ariaLabel = t({
    id: 'inbox.menuLabel',
    message: 'Menu',
    comment: 'Aria label for the inbox/bell icon in the header',
  })

  return (
    <Stack onPress={pushToInbox}>
      {hasInboxNotifications && (
        <AnimatedStack zi={5} pos="absolute" top="$-1" right="$-1" entering={ZoomIn} exiting={ZoomOut}>
          <Circle size={12} backgroundColor="$primary-500" />
        </AnimatedStack>
      )}
      <IconContainer bg="white" aria-label={ariaLabel} icon={<HeroIcons.Bell />} onPress={pushToInbox} />
    </Stack>
  )
}
