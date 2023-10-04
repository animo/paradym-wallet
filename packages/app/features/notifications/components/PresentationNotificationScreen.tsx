import type BottomSheet from '@gorhom/bottom-sheet'
import type { FormattedSubmission } from '@internal/agent'

import {
  YStack,
  Heading,
  Button,
  ScrollView,
  Spinner,
  Paragraph,
  Sheet,
  XStack,
  RefreshCw,
  Stack,
  BottomSheetScrollView,
} from '@internal/ui'
import { sanitizeString } from '@internal/utils'
import { useNavigation } from '@react-navigation/native'
import React, { useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import CredentialRowCard from 'app/components/CredentialRowCard'

interface PresentationNotificationScreenProps {
  submission: FormattedSubmission
  isAccepting?: boolean
  onAccept: () => void
  onDecline: () => void
  verifierName?: string
  submissionEntryIndexes: number[]
  onSelectCredentialIndexForSubmissionEntryIndex: (
    credentialIndex: number,
    submissionEntryIndex: number
  ) => void
}

export function PresentationNotificationScreen({
  onAccept,
  onDecline,
  isAccepting,
  submission,
  verifierName,
  submissionEntryIndexes,
  onSelectCredentialIndexForSubmissionEntryIndex,
}: PresentationNotificationScreenProps) {
  const safeArea = useSafeAreaInsets()
  const [changeSubmissionCredentialIndex, setChangeSubmissionCredentialIndex] = useState(-1)
  const submissionEntry =
    changeSubmissionCredentialIndex !== -1
      ? submission.entries[changeSubmissionCredentialIndex]
      : undefined

  const navigation = useNavigation()
  const ref = useRef<BottomSheet>(null)

  useEffect(() => {
    if (submissionEntry) {
      ref.current?.expand()
    } else {
      ref.current?.close()
    }
  }, [submissionEntry])

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: true,
    })
  }, [])

  return (
    <>
      <ScrollView
        bg="$grey-200"
        fullscreen
        space
        contentContainerStyle={{
          paddingTop: safeArea.top,
          minHeight: '100%',
        }}
      >
        <YStack g="xl" jc="space-between" pad="lg" py="$6" height="100%" bg="$grey-200">
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
                const entryIndex = submissionEntryIndexes[i] as number
                const selectedCredential = s.credentials[entryIndex]
                return (
                  <YStack key={i}>
                    <YStack
                      br="$4"
                      border
                      bg="$white"
                      gap="$2"
                      borderColor={s.isSatisfied ? '$grey-300' : '$danger-500'}
                      onPress={
                        s.credentials.length > 1
                          ? () => setChangeSubmissionCredentialIndex(i)
                          : undefined
                      }
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
                          <Stack pr="$3">
                            {s.credentials.length > 1 && <RefreshCw color="$grey-600" />}
                          </Stack>
                        </XStack>
                        {s.description && (
                          <Paragraph secondary px="$3" variant="text">
                            {s.description}
                          </Paragraph>
                        )}
                      </YStack>
                      {s.isSatisfied && selectedCredential?.requestedAttributes ? (
                        <YStack pad="md" gap="$2">
                          <Paragraph variant="sub">
                            The following information will be presented:
                          </Paragraph>
                          <YStack flexDirection="row" flexWrap="wrap">
                            {selectedCredential?.requestedAttributes.map((a) => (
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
            <YStack gap="$2">
              <Button.Solid disabled={isAccepting} onPress={onAccept}>
                {isAccepting ? <Spinner variant="dark" /> : 'Accept'}
              </Button.Solid>
              <Button.Outline onPress={onDecline}>Decline</Button.Outline>
            </YStack>
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
      <Sheet ref={ref} snapPoints={['40%']}>
        <BottomSheetScrollView>
          <Stack bg="$white" pb="$4">
            {submissionEntry?.credentials.map((c, credentialIndex) => {
              return (
                <CredentialRowCard
                  onPress={() => {
                    onSelectCredentialIndexForSubmissionEntryIndex(
                      credentialIndex,
                      changeSubmissionCredentialIndex
                    )
                    setChangeSubmissionCredentialIndex(-1)
                  }}
                  key={credentialIndex}
                  issuer={c.issuerName}
                  name={c.credentialName}
                  hideBorder={credentialIndex === submissionEntry.credentials.length - 1}
                  bgColor={c.backgroundColor}
                />
              )
            })}
          </Stack>
        </BottomSheetScrollView>
      </Sheet>
    </>
  )
}
