import { Paragraph, YStack, Icon, Button } from '@internal/ui'
import React from 'react'
import { createParam } from 'solito'
import { useLink } from 'solito/link'

const { useParam } = createParam<{ id: string }>()

export function ProofNotificationScreen() {
  const [id] = useParam('id')
  const link = useLink({
    href: '/',
  })

  // Go back home if no id is provided
  if (!id) {
    link.onPress()
    return null
  }

  return (
    <YStack f={1} jc="center" ai="center" space>
      <Paragraph ta="center" fow="700">
        Proof notification!
      </Paragraph>
      <Paragraph ta="center" fow="700">
        {id}
      </Paragraph>
      <Button.Text {...link} icon={<Icon name="ChevronLeft" />}>
        Go Home
      </Button.Text>
    </YStack>
  )
}
