import { Trans, useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import {
  Button,
  FloatingSheet,
  Heading,
  Paragraph,
  ScrollView,
  Stack,
  TableContainer,
  XStack,
  YStack,
} from '@package/ui'
import { sanitizeString } from '@package/utils'
import type { FormattedSubmission } from '@paradym/wallet-sdk/src/format/submission'
import { useNavigation } from 'expo-router'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const { t } = useLingui()
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
              {verifierName ? (
                <Heading heading="h2" fontWeight="$medium" ta="center" px="$4" letterSpacing={-0.5}>
                  <Trans
                    id="presentationNotification.receivedRequestWithVerifier"
                    comment="Heading shown when the user receives an information request including the verifier's name"
                  >
                    You have received an information request from {verifierName}
                  </Trans>
                </Heading>
              ) : (
                <Heading heading="h2" fontWeight="$medium" ta="center" px="$4" letterSpacing={-0.5}>
                  <Trans
                    id="presentationNotification.receivedRequestWithoutVerifier"
                    comment="Heading shown when the user receives an information request without the verifier's name"
                  >
                    You have received an information request
                  </Trans>
                </Heading>
              )}

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
                              name={
                                selectedCredential?.credential.display.name ?? s.name ?? t(commonMessages.credential)
                              }
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
                          <Paragraph variant="sub">
                            <Trans
                              id="presentationNotification.infoWillBePresented"
                              comment="Text shown before listing information that will be presented in response to an information request"
                            >
                              The following information will be presented:
                            </Trans>
                          </Paragraph>
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
                          {
                            <Paragraph px="$3" pb="$3" variant="sub" color="$danger-500">
                              <Trans
                                id="presentationNotification.missingCredential"
                                comment="Shown when a required credential is missing"
                              >
                                This credential is not present in your wallet.
                              </Trans>
                              {s.requestedAttributePaths.length > 0 && (
                                <Trans id="presentationNotification.requestedInformationPrefix">
                                  The following information is requested:
                                </Trans>
                              )}
                            </Paragraph>
                          }

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
                <Trans
                  id="presentationNotification.missingRequiredCredentials"
                  comment="Shown when the user lacks the required credentials to satisfy an information request"
                >
                  You don't have the required credentials to satisfy this request.
                </Trans>
              </Paragraph>
              <Button.Solid onPress={onDecline}>t(commonMessages.close)</Button.Solid>
            </YStack>
          )}
        </YStack>
      </ScrollView>
      <FloatingSheet
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        onDismiss={() => {
          setChangeSubmissionCredentialIndex(-1)
        }}
      >
        <Stack bg="$grey-100" p="$4" gap="$4" pb={bottom}>
          <Heading heading="h3" ta="center" py="$2">
            <Trans
              id="presentationNotification.selectCredentialTitle"
              comment="Title prompting the user to select which credential to use for the information request"
            >
              Select the credential you want to use
            </Trans>
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
      </FloatingSheet>
    </>
  )
}
