import { useW3cCredentialRecordById } from '@internal/agent'
import { TextButton, Paragraph, YStack, Icon } from '@internal/ui/src'
import React from 'react'
import { createParam } from 'solito'
import { useLink } from 'solito/link'

const { useParam } = createParam<{ id: string }>()

export function CredentialDetailScreen() {
  const [id] = useParam('id')
  const link = useLink({
    href: '/',
  })

  // Go back home if no id is provided
  if (!id) {
    link.onPress()
    return null
  }

  const record = useW3cCredentialRecordById(id)

  return (
    <YStack f={1} jc="center" ai="center" space>
      <Paragraph ta="center" fow="700">{`Credential Record id: ${id}`}</Paragraph>
      <Paragraph ta="center" fow="700">{`Record exists: ${record ? 'Yes' : 'No'}`}</Paragraph>
      <TextButton {...link} icon={<Icon name="ChevronLeft" />}>
        Go Home
      </TextButton>
    </YStack>
  )
}
