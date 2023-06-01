import type { W3cCredential } from '@internal/agent/types'

import { useW3cCredentialRecordById } from '@internal/agent'
import { YStack, ScrollView, paddingSizes, XStack, Button } from '@internal/ui'
import React from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import CredentialAttributes from 'app/components/CredentialAttributes'
import CredentialCard from 'app/components/CredentialCard'

const { useParam } = createParam<{ id: string }>()

export function CredentialDetailScreen() {
  const [id] = useParam('id')
  const router = useRouter()

  // Go back home if no id is provided
  if (!id) {
    router.back()
    return null
  }

  const record = useW3cCredentialRecordById(id)
  const credential = record?.credential as unknown as W3cCredential

  if (!credential) return null

  return (
    <ScrollView>
      <XStack>
        <Button.Text mt={paddingSizes.lg} onPress={() => router.back()}>
          Done
        </Button.Text>
      </XStack>
      <YStack
        g="3xl"
        jc="space-between"
        pad="lg"
        py={paddingSizes.xl}
        enterStyle={{ opacity: 0, y: 50 }}
        exitStyle={{ opacity: 0, y: -20 }}
        y={0}
        opacity={1}
        animation="lazy"
      >
        <YStack g="3xl">
          <CredentialCard
            iconUrl={credential.issuer.iconUrl}
            name={credential.name}
            issuerName={credential.issuer.name}
            subtitle={credential.description}
            bgColor={credential?.credentialBranding?.backgroundColor}
          />
          <CredentialAttributes subject={credential.credentialSubject} />
        </YStack>
      </YStack>
    </ScrollView>
  )
}
