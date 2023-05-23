import { useW3cCredentialRecords } from '@internal/agent'
import { Page, Paragraph, SolidButton, TextButton, YStack } from '@internal/ui'
import React from 'react'
import { useLink } from 'solito/link'

export function HomeScreen() {
  const { w3cCredentialRecords } = useW3cCredentialRecords()
  const linkProps = useLink({
    href: '/credentials/some-random-id',
  })

  const qrLinkProps = useLink({
    href: '/scan',
  })

  return (
    <Page jc="space-between">
      <YStack jc="center" ai="center" space>
        <Paragraph>You have {w3cCredentialRecords.length} credentials.</Paragraph>
        <TextButton {...linkProps}>Link to specific credential</TextButton>
      </YStack>
      <YStack jc="center">
        <SolidButton {...qrLinkProps}>Scan</SolidButton>
      </YStack>
    </Page>
  )
}
