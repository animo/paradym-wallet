import type { MattrW3cCredentialRecord, W3cCredential } from '@internal/agent/types'

import { parseCredentialOffer, useAgent, useW3cCredentialRecordById } from '@internal/agent'
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

type IncomingCredentialState = 'initial' | 'requesting' | 'failed' | 'saved'

export function CredentialNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const [uri] = useParam('uri')

  const [state, setState] = useState<IncomingCredentialState>('initial')
  const [credentialId, setCredentialId] = useState<string>()
  const [credential, setCredential] = useState<W3cCredential>()
  const [isDeleting, setIsDeleting] = useState(false)

  const record = useW3cCredentialRecordById(
    credentialId as string
  ) as unknown as MattrW3cCredentialRecord

  useEffect(() => {
    if (state === 'failed') {
      toast.show('Credential information could not be extracted.')
      router.back()
    }
  }, [state])

  useEffect(() => {
    if (!record && state === 'saved') {
      router.back()
      toast.show('Something went wrong. Try removing the credential manually.')
    } else {
      if (record) setCredential(record.credential)
    }
  }, [record])

  useEffect(() => {
    const requestCredential = async (uri: string) => {
      try {
        setState('requesting')
        const record = await parseCredentialOffer({ agent, data: decodeURIComponent(uri) })
        setState('saved')
        setCredentialId(record.id)
      } catch (e) {
        setState('failed')
      }
    }
    if (uri && state === 'initial') void requestCredential(uri)
  }, [uri])

  if (!credential || !credentialId || state === 'requesting') {
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
    setIsDeleting(true)
    await agent.w3cCredentials
      .removeCredentialRecord(credentialId)
      .then(() => {
        toast.show('Credential has been declined.')
      })
      .catch(() => {
        toast.show('Something went wrong. Try removing the credential manually.')
      })
  }

  if (!credential) return null

  return (
    <ScrollView>
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
          <Heading variant="h2" ta="center" px={paddingSizes.xl}>
            You have received the following credential from {credential.issuer.name}:
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
        <YStack
          gap={gapSizes.md}
          enterStyle={{ opacity: 0, y: 50 }}
          exitStyle={{ opacity: 0, y: -20 }}
          y={0}
          opacity={1}
          animation="lazyDelay100"
        >
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
