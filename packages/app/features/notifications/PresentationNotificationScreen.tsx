import type { PresentationDefinitionV1 } from '@internal/agent'
import type { FormattedSubmission } from 'app/utils'

import { presentationExchangeService, useAgent } from '@internal/agent'
import {
  YStack,
  useToastController,
  Heading,
  Button,
  ScrollView,
  Spinner,
  Page,
  Paragraph,
  AlertOctagon,
  XStack,
} from '@internal/ui'
import { sanitizeString } from '@internal/utils'
import React, { useEffect, useState } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import CredentialRowCard from 'app/components/CredentialRowCard'
import { formatPresentationSubmission } from 'app/utils'
type Query = { uri: string }

const { useParam } = createParam<Query>()

export function PresentationNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const [uri] = useParam('uri')

  const [canSatisfyRequest, setCanSatisfyRequest] = useState(false)
  const [purpose, setPurpose] = useState<string | undefined>('')
  const [submissions, setSubmissions] = useState<FormattedSubmission[] | undefined>()

  useEffect(() => {
    const requestProof = async (uri: string) => {
      try {
        await presentationExchangeService
          .selectCredentialsForRequest(
            agent.context,
            JSON.parse(decodeURIComponent(uri)) as PresentationDefinitionV1
          )
          .then((r) => {
            setCanSatisfyRequest(r.areRequirementsSatisfied)
            setPurpose(r.purpose)
            setSubmissions(formatPresentationSubmission(r))
          })
      } catch (e) {
        toast.show('Credential information could not be extracted.')
        router.back()
      }
    }
    if (uri) void requestProof(uri)
  }, [uri])

  if (!submissions) {
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
          Getting verification information
        </Paragraph>
      </Page>
    )
  }

  const pushToWallet = () => {
    router.back()
    router.push('/wallet')
  }

  const onProofAccept = () => {
    pushToWallet()
    toast.show('Information has been successfully shared.')
  }

  const onProofDecline = () => {
    pushToWallet()
    toast.show('Information request has been declined.')
  }

  return (
    <ScrollView
      fullscreen
      space
      contentContainerStyle={{
        minHeight: '100%',
      }}
    >
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
        height="100%"
        bg="$grey-200"
      >
        <YStack g="xl">
          <YStack ai="center" jc="center" gap="$4">
            {/* FIXME: You have received a request from <DOMAIN> */}
            <Heading variant="h1" ta="center" px="$4">
              Information request
            </Heading>
            <Paragraph ta="center" numberOfLines={3} secondary>
              {purpose}
            </Paragraph>
          </YStack>
          <YStack gap="$4">
            {submissions.map((s) => (
              <YStack key={s.name}>
                <YStack
                  br="$4"
                  border
                  bg="$white"
                  gap="$2"
                  borderColor={s.isSatisfied ? '$grey-300' : '$danger-500'}
                >
                  <YStack>
                    {!s.isSatisfied && (
                      <XStack pad="md" gap="$2" right={0} position="absolute">
                        <AlertOctagon size={16} color="$danger-500" />
                      </XStack>
                    )}
                    <CredentialRowCard issuer={s.issuerName} name={s.credentialName} />
                    <Paragraph secondary px="$3" variant="text">
                      {s.description}
                    </Paragraph>
                  </YStack>
                  {s.isSatisfied && s.requestedAttributes ? (
                    <YStack pad="md" gap="$2">
                      <Paragraph variant="sub">
                        The following information will be presented:
                      </Paragraph>
                      <YStack flexDirection="row" flexWrap="wrap">
                        {s.requestedAttributes.map((a) => (
                          <Paragraph flexBasis="50%" key={a} variant="annotation" secondary>
                            • {sanitizeString(a)}
                          </Paragraph>
                        ))}
                      </YStack>
                    </YStack>
                  ) : (
                    <Paragraph px="$3" pb="$3" variant="sub" color="$danger-500">
                      This credential is not present in your wallet.
                    </Paragraph>
                  )}
                </YStack>
              </YStack>
            ))}
          </YStack>
        </YStack>
        {canSatisfyRequest ? (
          <YStack gap="$2">
            <Button.Solid onPress={onProofAccept}>Accept</Button.Solid>
            <Button.Outline
              onPress={() => {
                void onProofDecline()
              }}
            >
              Decline
            </Button.Outline>
          </YStack>
        ) : (
          <YStack gap="$4">
            <Paragraph variant="sub" ta="center">
              You don't have the required credentials to satisfy this request.
            </Paragraph>
            <Button.Solid
              onPress={() => {
                void pushToWallet()
              }}
            >
              Close
            </Button.Solid>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}