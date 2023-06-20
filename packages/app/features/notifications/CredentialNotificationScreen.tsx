import type { W3cCredentialRecord } from '@internal/agent'

import {
  storeCredential,
  getCredentialForDisplay,
  receiveCredentialFromOpenId4VciOffer,
  useAgent,
} from '@internal/agent'
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

  const [credentialRecord, setCredentialRecord] = useState<W3cCredentialRecord>()
  const [isStoring, setIsStoring] = useState(false)

  const pushToWallet = () => {
    router.back()
    router.push('/wallet')
  }

  useEffect(() => {
    const requestCredential = async (uri: string) => {
      try {
        const record = await receiveCredentialFromOpenId4VciOffer({
          agent,
          data: decodeURIComponent(uri),
        })
        setCredentialRecord(record)
      } catch (e) {
        toast.show('Credential information could not be extracted.')
        pushToWallet()
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

  if (!credentialRecord.credential) {
    toast.show('Credential information could not be extracted.')
    pushToWallet()
    return null
  }

  const onCredentialAccept = async () => {
    setIsStoring(true)

    await storeCredential(agent, credentialRecord)
      .then(() => {
        toast.show('Credential has been added to your wallet.')
      })
      .catch(() => {
        toast.show('Something went wrong while storing the credential.')
      })
      .finally(() => {
        pushToWallet()
      })
  }

  const onCredentialDecline = () => {
    toast.show('Credential has been declined.')
    pushToWallet()
  }

  const { credential, display } = getCredentialForDisplay(credentialRecord)

  return (
    <ScrollView bg="$grey-200">
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
        <YStack g="2xl">
          <Heading variant="h2" ta="center" px="$4">
            You have received a credential
            {display.issuer?.name ? ` from ${display.issuer.name}` : ''}
          </Heading>
          <CredentialCard
            issuerImage={display.issuer.logo}
            name={display.name}
            issuerName={display.issuer.name}
            subtitle={display.description}
            bgColor={display.backgroundColor}
          />
          <CredentialAttributes
            subject={
              // FIXME: support credential with multiple subjects
              Array.isArray(credential.credentialSubject)
                ? credential.credentialSubject[0] ?? {}
                : credential.credentialSubject
            }
          />
        </YStack>
        <YStack gap="$2">
          <Button.Solid
            disabled={isStoring}
            onPress={() => {
              void onCredentialAccept()
            }}
          >
            {isStoring ? <Spinner /> : 'Accept'}
          </Button.Solid>
          <Button.Outline disabled={isStoring} onPress={onCredentialDecline}>
            Decline
          </Button.Outline>
        </YStack>
      </YStack>
      <Spacer />
    </ScrollView>
  )
}
