import type { CredentialDisplay } from '@internal/agent'

import { YStack, Heading, Button, Spacer, ScrollView, Spinner } from '@internal/ui'
import React from 'react'

import CredentialAttributes from 'app/components/CredentialAttributes'
import CredentialCard from 'app/components/CredentialCard'

interface CredentialNotificationScreenProps {
  display: CredentialDisplay

  attributes: Record<string, unknown>
  isAccepting?: boolean
  onAccept: () => void
  onDecline: () => void
}

export function CredentialNotificationScreen({
  display,
  attributes,
  isAccepting,
  onAccept,
  onDecline,
}: CredentialNotificationScreenProps) {
  return (
    <ScrollView bg="$grey-200">
      <YStack g="3xl" jc="space-between" pad="lg" py="$6">
        <YStack g="2xl">
          <Heading variant="h2" ta="center" px="$4">
            You have received a credential
            {display.issuer?.name ? ` from ${display.issuer.name}` : ''}
          </Heading>
          <CredentialCard
            issuerImage={display.issuer.logo}
            textColor={display.textColor}
            name={display.name}
            issuerName={display.issuer.name}
            backgroundImage={display.backgroundImage}
            subtitle={display.description}
            bgColor={display.backgroundColor}
          />
          <CredentialAttributes subject={attributes} />
        </YStack>
        <YStack gap="$2">
          <Button.Solid disabled={isAccepting} onPress={onAccept}>
            {isAccepting ? <Spinner variant="dark" /> : 'Accept'}
          </Button.Solid>
          <Button.Outline disabled={isAccepting} onPress={onDecline}>
            Decline
          </Button.Outline>
        </YStack>
      </YStack>
      <Spacer />
    </ScrollView>
  )
}
