import { getCredentialsForProofRequest, shareProof, useAgent } from '@internal/agent'
import {
  YStack,
  useToastController,
  Heading,
  Button,
  ScrollView,
  Spinner,
  Page,
  Paragraph,
} from '@internal/ui'
import { sanitizeString } from '@internal/utils'
import React, { useEffect, useState, useMemo } from 'react'
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

  const [credentialsForRequest, setCredentialsForRequest] =
    useState<Awaited<ReturnType<typeof getCredentialsForProofRequest>>>()
  const [isSharing, setIsSharing] = useState(false)

  const submissions = useMemo(
    () =>
      credentialsForRequest
        ? formatPresentationSubmission(credentialsForRequest.selectResults)
        : undefined,
    [credentialsForRequest]
  )

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  useEffect(() => {
    if (!uri) return

    getCredentialsForProofRequest({ agent, data: decodeURIComponent(uri) })
      .then((r) => {
        setCredentialsForRequest(r)
      })
      .catch(() => {
        toast.show('Presentation information could not be extracted.')
        pushToWallet()
      })
  }, [uri])

  if (!submissions || !credentialsForRequest) {
    return (
      <Page jc="center" ai="center" g="md">
        <Spinner />
        <Paragraph variant="sub" textAlign="center">
          Getting verification information
        </Paragraph>
      </Page>
    )
  }

  const onProofAccept = async () => {
    setIsSharing(true)

    await shareProof({ ...credentialsForRequest, agent })
      .then(() => {
        toast.show('Information has been successfully shared.')
      })
      .catch(() => {
        toast.show('Presentation could not be shared.')
      })
      .finally(() => {
        pushToWallet()
      })
  }

  const onProofDecline = () => {
    pushToWallet()
    toast.show('Information request has been declined.')
  }

  return (
    <ScrollView
      bg="$grey-200"
      fullscreen
      space
      contentContainerStyle={{
        minHeight: '100%',
      }}
    >
      <YStack g="3xl" jc="space-between" py="$6" height="100%">
        <YStack g="xl">
          <YStack ai="center" jc="center" gap="$4">
            <Heading variant="h2" ta="center" px="$4">
              You have received an information request from {credentialsForRequest.verifierHostName}
              .
            </Heading>
            <Paragraph variant="sub" ta="center" mx="$3" numberOfLines={3} secondary>
              {credentialsForRequest.selectResults.purpose}
            </Paragraph>
          </YStack>
          <YStack gap="$4">
            {submissions.map((s) => (
              <YStack key={s.name}>
                <YStack
                  borderBottomWidth={0.5}
                  borderTopWidth={0.5}
                  bg="$white"
                  gap="$2"
                  borderColor={s.isSatisfied ? '$grey-300' : '$danger-500'}
                >
                  <YStack>
                    <CredentialRowCard
                      issuer={s.issuerName}
                      name={s.credentialName}
                      hideBorder={true}
                      bgColor={s.backgroundColor}
                    />
                    <Paragraph secondary px="$4" variant="text">
                      {s.description}
                    </Paragraph>
                  </YStack>
                  {s.isSatisfied && s.requestedAttributes ? (
                    <YStack pad="lg" gap="$2">
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
        {credentialsForRequest.selectResults.areRequirementsSatisfied ? (
          <YStack gap="$2" px="$4">
            <Button.Solid
              disabled={isSharing}
              onPress={() => {
                void onProofAccept()
              }}
            >
              {isSharing ? <Spinner variant="dark" /> : 'Accept'}
            </Button.Solid>
            <Button.Outline onPress={onProofDecline}>Decline</Button.Outline>
          </YStack>
        ) : (
          <YStack gap="$4" px="$4">
            <Paragraph variant="sub" ta="center">
              You don't have the required credentials to satisfy this request.
            </Paragraph>
            <Button.Solid onPress={pushToWallet}>Close</Button.Solid>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}
