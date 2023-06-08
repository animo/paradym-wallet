import type { PresentationDefinitionV1 } from '@internal/agent'
import type { FormattedSubmission } from 'app/utils/formatPresentationSubmission'

import { presentationExchangeService, useAgent } from '@internal/agent'
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
  AlertOctagon,
  XStack,
} from '@internal/ui'
import React, { useEffect, useState } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import CredentialRowCard from 'app/components/CredentialRowCard'
import { formatPresentationSubmission } from 'app/utils/formatPresentationSubmission'

type Query = { uri: string }

const { useParam } = createParam<Query>()

export function PresentationNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const [uri] = useParam('uri')

  const [canSatisfyRequest, setCanSatisfyRequest] = useState(false)
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

  const onProofAccept = () => {
    router.back()
    toast.show('Information has been successfully shared.')
  }

  const onProofDecline = () => {
    if (!submissions) return
    router.back()
    toast.show('Information request has been declined.')
  }

  return (
    <ScrollView contentContainerStyle={{ height: '100%' }}>
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
        <YStack g="2xl">
          <Heading variant="h2" ta="center" px="$4">
            The following credentials have been requested
          </Heading>
          <YStack gap="$4">
            {submissions.map((s) => (
              <YStack key={s.name}>
                <YStack
                  pad="md"
                  py="$2"
                  br="$4"
                  border
                  bg="$white"
                  borderColor={s.credentialSubject ? '$grey-300' : '$danger-500'}
                >
                  {!s.credentialSubject && (
                    <XStack gap="$2" ai="center">
                      <AlertOctagon size={16} color="$danger-500" />
                      <Paragraph variant="sub" color="$danger-500">
                        You don't have this credential.
                      </Paragraph>
                    </XStack>
                  )}
                  <CredentialRowCard
                    issuer="Dutch Blockchain Coalition"
                    name="DBC Conference Attendee"
                  />
                  <Paragraph variant="sub" secondary>
                    All attributes will be shared.
                  </Paragraph>
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
          <YStack>
            <Button.Solid
              onPress={() => {
                void onProofDecline()
              }}
            >
              Close
            </Button.Solid>
          </YStack>
        )}
      </YStack>
      <Spacer />
    </ScrollView>
  )
}
