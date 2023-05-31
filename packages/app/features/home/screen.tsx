import { useW3cCredentialRecords } from '@internal/agent'
import { Page, Paragraph, Button } from '@internal/ui'
import React from 'react'
import { useLink } from 'solito/link'

export function HomeScreen() {
  const { w3cCredentialRecords } = useW3cCredentialRecords()

  // For testing purposes
  const firstItem =
    w3cCredentialRecords && w3cCredentialRecords.length !== 0 ? w3cCredentialRecords[0] : undefined

  const link = useLink({
    href: `/credentials/${firstItem?.id ?? 'unknown'}`,
  })

  return (
    <Page jc="center" ai="center" space>
      <Paragraph>You have {w3cCredentialRecords.length} credentials.</Paragraph>
      <Button.Text {...link}>Show me one!</Button.Text>
    </Page>
  )
}
