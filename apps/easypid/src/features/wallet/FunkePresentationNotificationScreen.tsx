import type { CredentialMetadata, FormattedSubmission } from '@package/agent'
import {
  Button,
  Heading,
  HeroIcons,
  IdCardRequestedAttributesSection,
  Paragraph,
  ProgressBar,
  ScrollView,
  Spacer,
  YStack,
} from '@package/ui'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Circle } from 'tamagui'
import germanIssuerImage from '../../../assets/german-issuer-image.png'

import { DualResponseButtons, useScrollViewPosition } from '@package/app'
import { useRouter } from 'expo-router'
import {
  getSdJwtPidAttributesForDisplay,
  getSdJwtPidDisclosedAttributeNames,
  getMdocPidDisclosedAttributeNames,
  getMdocPidAttributesForDisplay,
} from '../../hooks'

interface FunkePresentationNotificationScreenProps {
  submission: FormattedSubmission
  isAccepting?: boolean
  onAccept: () => void
  onDecline: () => void
  verifierHost?: string
}

export function FunkePresentationNotificationScreen({
  onAccept,
  onDecline,
  isAccepting,
  submission,
  verifierHost,
}: FunkePresentationNotificationScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()

  const entry = submission.entries[0]
  const credential = entry?.credentials[0]

  // TODO: combine methods so we don't have to care about formats here
  const type = credential ? (credential.disclosedPayload?.vct ? 'sd-jwt' : 'mdoc') : undefined
  const disclosedAttributes =
    type === 'mdoc'
      ? getMdocPidDisclosedAttributeNames(credential.disclosedPayload ?? {})
      : type === 'sd-jwt'
        ? getSdJwtPidDisclosedAttributeNames(credential.disclosedPayload ?? {})
        : []
  const disclosedPayload =
    type === 'mdoc'
      ? getMdocPidAttributesForDisplay(
          credential.disclosedPayload ?? {},
          (credential.metadata ?? {}) as CredentialMetadata
        )
      : type === 'sd-jwt'
        ? getSdJwtPidAttributesForDisplay(
            credential.disclosedPayload ?? {},
            credential.metadata ?? ({} as CredentialMetadata)
          )
        : {}

  return (
    <YStack background="$background" height="100%">
      {/* This is the header where the scroll view get's behind. We have the same content in the scrollview, but you
       * don't see that content. It's just so we can make the scrollview minheight 100%.  */}
      <YStack zIndex={2} w="100%" top={0} position="absolute">
        <Spacer size="$13" w="100%" backgroundColor="$background" />
        <YStack borderWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'} />
      </YStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ minHeight: '100%' }}
      >
        <Spacer size="$13" />
        <YStack borderWidth={0.5} borderColor="$background" />
        <YStack gap="$6" jc="space-between" p="$4" paddingBottom={bottom} flex-1>
          <YStack gap="$6">
            <YStack gap="$3">
              <ProgressBar value={10} />
              <Heading variant="title">Review the request</Heading>
            </YStack>

            <IdCardRequestedAttributesSection
              disclosedAttributes={disclosedAttributes}
              description={
                disclosedAttributes.length === 0
                  ? "You don't have the requested credential"
                  : disclosedAttributes.length > 1
                    ? `These ${disclosedAttributes.length} attributes will be shared`
                    : 'The following attribute will be shared'
              }
              issuerImage={germanIssuerImage}
              onPressIdCard={() => {
                router.push(
                  `/credentials/pidRequestedAttributes?disclosedPayload=${encodeURIComponent(JSON.stringify(disclosedPayload ?? {}))}&disclosedAttributeLength=${disclosedAttributes?.length ?? 0}`
                )
              }}
            />
            <YStack gap="$1">
              <Circle size="$2" mb="$2" backgroundColor="$primary-500">
                <HeroIcons.InformationCircle color="$white" size={18} />
              </Circle>
              <Heading variant="h2">Reason for request</Heading>
              <Paragraph size="$3" secondary>
                {submission.purpose ??
                  submission.entries[0].description ??
                  'No information was provided on the purpose of the data request. Be cautious'}
              </Paragraph>
            </YStack>

            {verifierHost && (
              <YStack gap="$1">
                <Circle size="$2" mb="$2" backgroundColor="$primary-500">
                  <HeroIcons.User color="$white" size={18} />
                </Circle>
                <Heading variant="h2">Requester</Heading>
                <Paragraph size="$3" secondary>
                  {verifierHost}
                </Paragraph>
              </YStack>
            )}
          </YStack>

          {submission.areAllSatisfied ? (
            <DualResponseButtons
              align="horizontal"
              acceptText="Share"
              declineText="Cancel"
              onAccept={onAccept}
              onDecline={onDecline}
              isAccepting={isAccepting}
            />
          ) : (
            <YStack gap="$3">
              <Paragraph variant="sub" ta="center">
                You don't have the required credentials
              </Paragraph>
              <Button.Solid onPress={onDecline}>Close</Button.Solid>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
