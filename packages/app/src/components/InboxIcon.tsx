import { LucideIcons, XStack } from '@package/ui'
import { useHasInboxNotifications } from '@paradym/wallet-sdk/hooks/useHasInboxNotifications'
import { useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { Circle } from 'tamagui'

export function InboxIcon() {
  const { push } = useRouter()
  const { hasInboxNotifications } = useHasInboxNotifications()

  return (
    <TouchableOpacity onPress={() => push('/notifications/inbox')}>
      <XStack>
        <LucideIcons.Inbox />
        {hasInboxNotifications && <Circle ml="$-2" size={10} backgroundColor="$danger-500" />}
      </XStack>
    </TouchableOpacity>
  )
}
