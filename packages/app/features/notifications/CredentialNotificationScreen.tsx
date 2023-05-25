import type { MattrW3cCredentialRecord } from '@internal/agent/types'

import { useAgent, useW3cCredentialRecordById } from '@internal/agent'
import {
  YStack,
  useToastController,
  Heading,
  Button,
  gapSizes,
  Spacer,
  ScrollView,
  Spinner,
  paddingSizes,
} from '@internal/ui'
import React, { useState } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import CredentialAttributes from 'app/components/CredentialAttributes'
import CredentialCard from 'app/components/CredentialCard'

const { useParam } = createParam<{ id: string }>()

export function CredentialNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const [id] = useParam('id')
  const record = useW3cCredentialRecordById(id as string) as unknown as MattrW3cCredentialRecord

  const [isLoading, setIsLoading] = useState(false)

  // Go back home if no id/record is provided
  if (!id || !record) {
    toast.show('Credential could not be found.')
    router.back()
    return null
  }

  const { credential } = record

  const onCredentialAccept = async () => {
    setIsLoading(true)
    // FIXME: this forces the screen to refresh after loading state changes
    await new Promise((resolve) => setTimeout(resolve, 1))
    router.back()
    toast.show('Credential has been successfully added to your wallet.')
  }

  const onCredentialDecline = async () => {
    await agent.w3cCredentials
      .removeCredentialRecord(id)
      .then(() => {
        router.back()
        toast.show('Credential has been declined.')
      })
      .catch(() => {
        router.back()
        toast.show('Something went wrong. Try removing the credential from the wallet tab.')
      })
  }

  return (
    <ScrollView>
      <YStack g="3xl" jc="space-between" pad="lg" py={paddingSizes.xl}>
        <YStack g="3xl">
          <Heading variant="h2" ta="center" px={paddingSizes.xl}>
            {credential.issuer.name} has send you the following credential:
          </Heading>
          <CredentialCard
            iconUrl={credential.issuer.iconUrl}
            name={credential.name}
            issuerName={credential.issuer.name}
            subtitle={credential.description}
            bgColor={credential?.credentialBranding?.backgroundColor}
          />
          <CredentialAttributes subject={credential.credentialSubject} />
        </YStack>
        <YStack gap={gapSizes.md}>
          <Button.Solid
            onPress={() => {
              void onCredentialAccept()
            }}
          >
            {isLoading ? <Spinner /> : 'Accept'}
          </Button.Solid>
          <Button.Outline
            onPress={() => {
              void onCredentialDecline()
            }}
          >
            Decline
          </Button.Outline>
        </YStack>
      </YStack>
      <Spacer />
    </ScrollView>
  )
}
