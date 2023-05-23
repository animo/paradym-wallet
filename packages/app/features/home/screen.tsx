import { useW3cCredentialRecords } from '@internal/agent'
import { Page, Paragraph, YStack } from '@internal/ui'
import React from 'react'
import { useLink } from 'solito/link'

export function HomeScreen() {
  const { w3cCredentialRecords } = useW3cCredentialRecords()

  const link = useLink({
    href: '/notifications/credential/123',
  })

  return (
    <Page jc="space-between">
      <YStack jc="center" ai="center" space>
        <Paragraph {...link}>You have {w3cCredentialRecords.length} credentials.</Paragraph>
      </YStack>
    </Page>
  )
}
