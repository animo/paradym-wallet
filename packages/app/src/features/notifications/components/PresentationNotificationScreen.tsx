import type BottomSheet from '@gorhom/bottom-sheet'
import type { FormattedSubmission } from '@package/agent'

import {
  BottomSheetScrollView,
  Button,
  Heading,
  LucideIcons,
  Paragraph,
  ScrollView,
  Sheet,
  Stack,
  XStack,
  YStack,
} from '@package/ui'
import { sanitizeString } from '@package/utils'
import React, { useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useNavigation } from 'expo-router'
import { CredentialRowCard, DualResponseButtons } from '../../../components'

interface PresentationNotificationScreenProps {
  submission: FormattedSubmission
  isAccepting?: boolean
  onAccept: () => void
  onDecline: () => void
  verifierName?: string
  selectedCredentials: { [inputDescriptorId: string]: string }
  onSelectCredentialForInputDescriptor: (inputDescriptorId: string, credentialId: string) => void
}

export function PresentationNotificationScreen({
  onAccept,
  onDecline,
  isAccepting,
  submission,
  verifierName,
  selectedCredentials,
  onSelectCredentialForInputDescriptor,
}: PresentationNotificationScreenProps) {
  const [changeSubmissionCredentialIndex, setChangeSubmissionCredentialIndex] = useState(-1)
  const { bottom } = useSafeAreaInsets()

  const currentSubmissionEntry =
    changeSubmissionCredentialIndex !== -1 ? submission.entries[changeSubmissionCredentialIndex] : undefined

  const navigation = useNavigation()
  const ref = useRef<BottomSheet>(null)

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
    <>
      <ScrollView
        bg="$background"
        contentContainerStyle={{
          minHeight: '100%',
        }}
        safeAreaBottom={bottom}
      >
        <YStack g="3xl" jc="space-between" pad="lg" py="$6" height="100%" bg="$background">
          <YStack g="xl">
            <YStack ai="center" jc="center" gap="$4">
              <Heading variant="h2" ta="center" px="$4">
                You have received an information request
                {verifierName ? ` from ${verifierName}` : ''}.
              </Heading>
              {submission.purpose && (
                <Paragraph variant="sub" ta="center" mx="$3" numberOfLines={3} secondary>
                  {submission.purpose}
                </Paragraph>
              )}
            </YStack>
            <YStack gap="$4">
              {submission.entries.map((s, i) => {
                const selectedCredentialId = selectedCredentials[s.inputDescriptorId]
                const selectedCredential = s.credentials.find((c) => c.id === selectedCredentialId) ?? s.credentials[0]

                return (
                  <YStack key={s.inputDescriptorId}>
                    <YStack
                      br="$4"
                      border
                      bg="$white"
                      gap="$2"
                      borderColor={s.isSatisfied ? '$grey-300' : '$danger-500'}
                      // disable credential selection until we have better UX
                      // onPress={s.credentials.length > 1 ? () => setChangeSubmissionCredentialIndex(i) : undefined}
                      pressStyle={{ backgroundColor: s.isSatisfied ? '$grey-100' : undefined }}
                    >
                      <YStack gap="$2">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Stack flex={1}>
                            <CredentialRowCard
                              issuer={selectedCredential?.issuerName}
                              name={selectedCredential?.credentialName ?? s.name}
                              hideBorder={true}
                              bgColor={selectedCredential?.backgroundColor}
                            />
                          </Stack>
                          {/* Disable credential selection until we have better UX */}
                          {/* <Stack pr="$3">{s.credentials.length > 1 && <LucideIcons.RefreshCw color="$grey-600" />}</Stack> */}
                        </XStack>
                        {s.description && (
                          <Paragraph secondary px="$3" variant="text">
                            {s.description}
                          </Paragraph>
                        )}
                      </YStack>
                      {s.isSatisfied && selectedCredential?.requestedAttributes ? (
                        <YStack px="$3" pb="$3" gap="$2">
                          <Paragraph variant="sub">The following information will be presented:</Paragraph>
                          <YStack flexDirection="row" flexWrap="wrap">
                            {selectedCredential.requestedAttributes.map((a) => (
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
                )
              })}
            </YStack>
          </YStack>
          {submission.areAllSatisfied ? (
            <DualResponseButtons onAccept={onAccept} onDecline={onDecline} isAccepting={isAccepting} />
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
      <Sheet ref={ref} snapPoints={['40%']} onClose={() => setChangeSubmissionCredentialIndex(-1)}>
        <BottomSheetScrollView>
          <Stack bg="$white" pb="$4">
            {currentSubmissionEntry?.credentials.map((c, credentialIndex) => (
              <CredentialRowCard
                onPress={() => {
                  onSelectCredentialForInputDescriptor(currentSubmissionEntry.inputDescriptorId, c.id)
                  setChangeSubmissionCredentialIndex(-1)
                }}
                key={c.id}
                issuer={c.issuerName}
                name={c.credentialName}
                hideBorder={credentialIndex === currentSubmissionEntry.credentials.length - 1}
                bgColor={c.backgroundColor}
              />
            ))}
          </Stack>
        </BottomSheetScrollView>
      </Sheet>
    </>
  )
}
