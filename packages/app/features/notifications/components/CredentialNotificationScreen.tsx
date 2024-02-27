import type { CredentialDisplay } from '@internal/agent'

import { YStack, Heading, ScrollView } from '@internal/ui'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import CredentialAttributes from 'app/components/CredentialAttributes'
import CredentialCard from 'app/components/CredentialCard'
import DualResponseButtons from 'app/components/DualResponseButtons'

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
  const { bottom } = useSafeAreaInsets()
  return (
    <ScrollView
      bg="$grey-200"
      contentContainerStyle={{
        minHeight: '100%',
      }}
      safeAreaBottom={bottom}
    >
      <YStack g="3xl" jc="space-between" height="100%" pad="lg" py="$6">
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
        <DualResponseButtons onAccept={onAccept} onDecline={onDecline} isAccepting={isAccepting} />
      </YStack>
    </ScrollView>
  )
}
