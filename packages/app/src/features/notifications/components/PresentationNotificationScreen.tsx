import type { FormattedSubmission } from '@package/agent'

import { Button, Heading, Paragraph, ScrollView, Sheet, Stack, TableContainer, XStack, YStack } from '@package/ui'
import { sanitizeString } from '@package/utils'
import React, { useEffect, useState } from 'react'
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
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [changeSubmissionCredentialIndex, setChangeSubmissionCredentialIndex] = useState(-1)
  const { bottom } = useSafeAreaInsets()

  const currentSubmissionEntry =
    changeSubmissionCredentialIndex !== -1 ? submission.entries[changeSubmissionCredentialIndex] : undefined

  const navigation = useNavigation()

  useEffect(() => {
    if (currentSubmissionEntry) {
      setIsSheetOpen(true)
    } else {
      setIsSheetOpen(false)
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
              <Heading variant="h2" fontWeight="$medium" ta="center" px="$4" letterSpacing={-0.5}>
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
                const selectedCredential = s.isSatisfied
                  ? s.credentials.find((c) => c.credential.id === selectedCredentialId) ?? s.credentials[0]
                  : undefined

                return (
                  <YStack key={s.inputDescriptorId}>
                    <YStack
                      br="$4"
                      border
                      bg="$white"
                      gap="$2"
                      borderColor={s.isSatisfied ? '$grey-300' : '$danger-500'}
                    >
                      <YStack gap="$2">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Stack flex={1}>
                            <CredentialRowCard
                              issuer={selectedCredential?.credential.display.issuer.name}
                              name={selectedCredential?.credential.display.name ?? s.name ?? 'Credential'}
                              hideBorder={true}
                              bgColor={selectedCredential?.credential.display.backgroundColor}
                            />
                          </Stack>
                          {/* // FIXME: disable credential selection until we have better UX */}
                          {/* <Stack
                            pos="absolute"
                            right="$0"
                            p="$4"
                            pressStyle={{ opacity: 0.8 }}
                            onPress={s.credentials.length > 1 ? () => setChangeSubmissionCredentialIndex(i) : undefined}
                          >
                            {s.credentials.length > 1 && <LucideIcons.RefreshCw color="$grey-500" />}
                          </Stack> */}
                        </XStack>
                        {s.description && (
                          <Paragraph secondary px="$3" variant="sub">
                            {s.description}
                          </Paragraph>
                        )}
                      </YStack>
                      {s.isSatisfied ? (
                        <YStack px="$3" pb="$3" gap="$2">
                          <Paragraph variant="sub">The following information will be presented:</Paragraph>
                          <YStack flexDirection="row" flexWrap="wrap">
                            {Array.from(new Set(selectedCredential?.disclosed.paths.map((path) => path[0])))?.map(
                              (a) => (
                                <Paragraph flexBasis="50%" key={a} variant="annotation" secondary>
                                  • {sanitizeString(a)}
                                </Paragraph>
                              )
                            )}
                          </YStack>
                        </YStack>
                      ) : (
                        <YStack px="$3" pb="$3" gap="$2">
                          <Paragraph px="$3" pb="$3" variant="sub" color="$danger-500">
                            This credential is not present in your wallet.{' '}
                            {s.requestedAttributePaths.length > 0 ? 'The folloing information is requested:' : ''}
                          </Paragraph>
                          {s.requestedAttributePaths.length > 0 && (
                            <YStack flexDirection="row" flexWrap="wrap">
                              {Array.from(new Set(s.requestedAttributePaths.map((p) => p[0])))
                                .filter((a): a is string => typeof a === 'string')
                                .map((a) => (
                                  <Paragraph flexBasis="50%" key={a} variant="annotation" secondary>
                                    • {sanitizeString(a)}
                                  </Paragraph>
                                ))}
                            </YStack>
                          )}
                        </YStack>
                      )}
                    </YStack>
                  </YStack>
                )
              })}
            </YStack>
          </YStack>
          {submission.areAllSatisfied ? (
            <DualResponseButtons onAccept={onAccept} onDecline={onDecline} isLoading={isAccepting} />
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
      <Sheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        onOpenChange={() => {
          setChangeSubmissionCredentialIndex(-1)
        }}
      >
        <Stack bg="$grey-100" p="$4" gap="$4" pb={bottom}>
          <Heading variant="h3" ta="center" py="$2">
            Select the credential you want to use
          </Heading>
          <TableContainer>
            {currentSubmissionEntry?.isSatisfied &&
              currentSubmissionEntry?.credentials.map((c, credentialIndex) => (
                <CredentialRowCard
                  onPress={() => {
                    onSelectCredentialForInputDescriptor(currentSubmissionEntry.inputDescriptorId, c.credential.id)
                    setChangeSubmissionCredentialIndex(-1)
                  }}
                  key={c.credential.id}
                  issuer={c.credential.display.issuer.name}
                  name={c.credential.display.name}
                  hideBorder={credentialIndex === currentSubmissionEntry.credentials.length - 1}
                  bgColor={c.credential.display.backgroundColor}
                />
              ))}
          </TableContainer>
        </Stack>
      </Sheet>
    </>
  )
}
