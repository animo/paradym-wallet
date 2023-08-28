import type { FormattedSubmission } from '@internal/agent'

import { YStack, Heading, Button, ScrollView, Spinner, Paragraph } from '@internal/ui'
import { sanitizeString } from '@internal/utils'
import React from 'react'

import CredentialRowCard from 'app/components/CredentialRowCard'

interface PresentationNotificationScreenProps {
  submission: FormattedSubmission
  isAccepting?: boolean
  onAccept: () => void
  onDecline: () => void
  verifierName: string
}

export function PresentationNotificationScreen({
  onAccept,
  onDecline,
  isAccepting,
  submission,
  verifierName,
}: PresentationNotificationScreenProps) {
  return (
    <ScrollView
      bg="$grey-200"
      fullscreen
      space
      contentContainerStyle={{
        minHeight: '100%',
      }}
    >
      <YStack g="3xl" jc="space-between" pad="lg" py="$6" height="100%" bg="$grey-200">
        <YStack g="xl">
          <YStack ai="center" jc="center" gap="$4">
            <Heading variant="h2" ta="center" px="$4">
              You have received an information request from {verifierName}.
            </Heading>
            {submission.purpose && (
              <Paragraph variant="sub" ta="center" mx="$3" numberOfLines={3} secondary>
                {submission.purpose}
              </Paragraph>
            )}
          </YStack>
          <YStack gap="$4">
            {submission.entries.map((s) => (
              <YStack key={s.name}>
                <YStack
                  br="$4"
                  border
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
                    {s.description && (
                      <Paragraph secondary px="$3" variant="text">
                        {s.description}
                      </Paragraph>
                    )}
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
  )
}
