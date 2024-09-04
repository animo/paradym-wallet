import type { CredentialDisplay } from '@package/agent'

import { Heading, ScrollView, YStack } from '@package/ui'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CredentialAttributes } from '../../../components'
import { CredentialCard } from '../../../components'
import { DualResponseButtons } from '../../../components'

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
      bg="$background"
      contentContainerStyle={{
        minHeight: '90%',
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
