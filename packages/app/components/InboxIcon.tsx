import { useHasInboxNotifications } from '@internal/agent'
import { XStack, Inbox } from '@internal/ui'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { useRouter } from 'solito/router'
import { Circle } from 'tamagui'

export default function InboxIcon() {
  const { push } = useRouter()
  const { hasInboxNotifications } = useHasInboxNotifications()

  return (
    <TouchableOpacity onPress={() => push('/notifications/inbox')}>
      <XStack>
        <Inbox />
        {hasInboxNotifications && <Circle ml="$-0.75" size="$0.75" backgroundColor="$danger-500" />}
      </XStack>
    </TouchableOpacity>
  )
}
