import type BottomSheet from '@gorhom/bottom-sheet'
import type { FormattedSubmission } from '@package/agent'
import germanIssuerImage from '../../../assets/german-issuer-image.png'
import {
  BottomSheetScrollView,
  Button,
  Heading,
  HeroIcons,
  IdCard,
  IdCardAttributes,
  Paragraph,
  ProgressHeader,
  ScrollView,
  Sheet,
  Spacer,
  Stack,
  XStack,
  YStack,
} from '@package/ui'
import { sanitizeString } from '@package/utils'
import React, { useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Circle } from 'tamagui'

import { useNavigation, useRouter } from 'expo-router'
import { CredentialRowCard, DualResponseButtons } from '@package/app'

interface FunkePresentationNotificationScreenProps {
  submission: FormattedSubmission
  isAccepting?: boolean
  onAccept: () => void
  onDecline: () => void
  verifierName?: string
  selectedCredentials: { [inputDescriptorId: string]: string }
  onSelectCredentialForInputDescriptor: (inputDescriptorId: string, credentialId: string) => void
}

export function FunkePresentationNotificationScreen({
  onAccept,
  onDecline,
  isAccepting,
  submission,
  verifierName,
  selectedCredentials,
  onSelectCredentialForInputDescriptor,
}: FunkePresentationNotificationScreenProps) {
  const [changeSubmissionCredentialIndex, setChangeSubmissionCredentialIndex] = useState(-1)
  const { bottom, top } = useSafeAreaInsets()

  const currentSubmissionEntry =
    changeSubmissionCredentialIndex !== -1 ? submission.entries[changeSubmissionCredentialIndex] : undefined

  const navigation = useNavigation()
  const ref = useRef<BottomSheet>(null)
  const router = useRouter()

  useEffect(() => {
    if (currentSubmissionEntry) {
      ref.current?.expand()
    } else {
      ref.current?.close()
    }
  }, [currentSubmissionEntry])

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: true,
    })
  }, [navigation])

  return (
    <ScrollView
      bg="$background"
      contentContainerStyle={{
        minHeight: '100%',
      }}
      // safeAreaBottom={bottom}
      safeAreaTop={top}
    >
      <YStack g="3xl" jc="space-between" pad="lg" pt="$6" flex-1 bg="$background">
        <YStack gap="$4">
          <YStack>
            <ProgressHeader progress={10} />
            <Heading variant="title">Review the request</Heading>
          </YStack>

          <YStack gap="$1">
            <Circle size="$2" mb="$2" backgroundColor="$primary-500">
              <HeroIcons.CircleStack color="$white" size={18} />
            </Circle>
            <Heading variant="h2">Requested data</Heading>
            <Paragraph size="$3" secondary>
              Only these 8 attributes will be shared.
            </Paragraph>
            <Spacer />
            <IdCardAttributes
              onPress={() => {
                console.log(
                  `/credentials/pidRequestedAttributes?requestedAttributes=${encodeURIComponent(JSON.stringify(submission.entries[0].credentials[0].requestedAttributes))}`
                )
                router.push(
                  `/credentials/pidRequestedAttributes?requestedAttributes=${encodeURIComponent(JSON.stringify(submission.entries[0].credentials[0].requestedAttributes))}`
                )
              }}
              attributes={submission.entries[0].credentials[0].requestedAttributes ?? []}
              issuerImage={germanIssuerImage}
            />
          </YStack>
          <YStack gap="$1">
            <Circle size="$2" mb="$2" backgroundColor="$primary-500">
              <HeroIcons.InformationCircle color="$white" size={18} />
            </Circle>
            <Heading variant="h2">Reason for request</Heading>
            <Paragraph size="$3" secondary>
              {submission.purpose
                ? submission.purpose
                : 'No information was provided on the purpose of the data request. Be cautious'}
            </Paragraph>
          </YStack>
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
          <YStack gap="$4">
            <Paragraph variant="sub" ta="center">
              You don't have the required credentials to satisfy this request.
            </Paragraph>
            <Button.Solid onPress={onDecline}>Close</Button.Solid>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}
