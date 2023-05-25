import { useW3cCredentialRecords } from '@internal/agent'
import { Page, Paragraph } from '@internal/ui'
import React from 'react'
import { useLink } from 'solito/link'

export function HomeScreen() {
  const { w3cCredentialRecords } = useW3cCredentialRecords()

  const link = useLink({
    href: '/notifications/credential/02aefe54-f64e-40f8-85b1-46630f241906',
  })

  return (
    <Page jc="center" ai="center" space>
      <Paragraph {...link}>You have {w3cCredentialRecords.length} credentials.</Paragraph>
    </Page>
  )
}
