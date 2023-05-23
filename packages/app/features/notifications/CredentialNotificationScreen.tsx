import { TextButton, Paragraph, YStack, Icon, useToastController } from '@internal/ui'
import React from 'react'
import { createParam } from 'solito'
import { useLink } from 'solito/link'

const { useParam } = createParam<{ id: string }>()

export function CredentialNotificationScreen() {
  const toast = useToastController()
  const [id] = useParam('id')
  const link = useLink({
    href: '/',
  })

  // Go back home if no id is provided
  if (!id) {
    link.onPress()
    toast.show('There was a problem with the credential offer. Try again.')
    return null
  }

  return (
    <YStack f={1} jc="center" ai="center" space>
      <Paragraph ta="center" fow="700">
        Credential notification!
      </Paragraph>
      <Paragraph ta="center" fow="700">
        {id}
      </Paragraph>
      <TextButton {...link} icon={<Icon name="ChevronLeft" />}>
        Go Home
      </TextButton>
    </YStack>
  )
}
