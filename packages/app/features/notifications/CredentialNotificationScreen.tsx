import type { MattrW3cCredentialRecord } from '@internal/agent/types'

import { receiveCredentialFromOpenId4VciOffer, useAgent } from '@internal/agent'
import {
  YStack,
  useToastController,
  Heading,
  Button,
  Spacer,
  ScrollView,
  Spinner,
  Page,
  Paragraph,
} from '@internal/ui'
import React, { useEffect, useState } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import CredentialAttributes from 'app/components/CredentialAttributes'
import CredentialCard from 'app/components/CredentialCard'

type Query = { uri: string }

const { useParam } = createParam<Query>()

export function CredentialNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const [uri] = useParam('uri')

  const [credentialRecord, setCredentialRecord] = useState<MattrW3cCredentialRecord>()
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const requestCredential = async (uri: string) => {
      try {
        const record = await receiveCredentialFromOpenId4VciOffer({
          agent,
          data: decodeURIComponent(uri),
        })
        setCredentialRecord(record as unknown as MattrW3cCredentialRecord)
      } catch (e) {
        toast.show('Credential information could not be extracted.')
        router.back()
      }
    }
    if (uri) void requestCredential(uri)
  }, [uri])

  if (!credentialRecord) {
    return (
      <Page
        jc="center"
        ai="center"
        g="md"
        enterStyle={{ opacity: 0, y: 50 }}
        exitStyle={{ opacity: 0, y: -20 }}
        y={0}
        opacity={1}
        animation="lazy"
      >
        <Spinner />
        <Paragraph variant="sub" textAlign="center">
          Getting credential information
        </Paragraph>
      </Page>
    )
  }

  const onCredentialAccept = () => {
    router.back()
    toast.show('Credential has been added to your wallet.')
  }

  const onCredentialDecline = async () => {
    if (!credentialRecord.id) return
    setIsDeleting(true)
    await agent.w3cCredentials
      .removeCredentialRecord(credentialRecord.id)
      .then(() => {
        toast.show('Credential has been declined.')
      })
      .catch(() => {
        toast.show('Something went wrong. Try removing the credential manually.')
      })
      .finally(() => router.back())
  }

  if (!credentialRecord.credential) {
    toast.show('Credential information could not be extracted.')
    router.back()
    return null
  }

  const credential = credentialRecord.credential

  if (!credential) return null

  return (
    <ScrollView>
      <YStack
        g="3xl"
        jc="space-between"
        pad="lg"
        py="$6"
        enterStyle={{ opacity: 0, y: 50 }}
        exitStyle={{ opacity: 0, y: -20 }}
        y={0}
        opacity={1}
        animation="lazy"
      >
        <YStack g="3xl">
          <Heading variant="h2" ta="center" px="$4">
            {credential.issuer.name} has send you a credential
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
        <YStack gap="$2">
          <Button.Solid onPress={onCredentialAccept}>Accept</Button.Solid>
          <Button.Outline
            onPress={() => {
              void onCredentialDecline()
            }}
          >
            {isDeleting ? <Spinner /> : 'Decline'}
          </Button.Outline>
        </YStack>
      </YStack>
      <Spacer />
    </ScrollView>
  )
}
