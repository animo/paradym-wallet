import { Heading, ScrollView, YStack } from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { CredentialDisplay } from '@package/sdk/src/display/credential'
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
        minHeight: '100%',
      }}
      safeAreaBottom={bottom}
    >
      <YStack g="3xl" jc="space-between" height="100%" pad="lg" py="$6">
        <YStack g="2xl">
          <Heading variant="h2" fontWeight="$medium" ta="center" px="$4" letterSpacing={-0.5}>
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
          <CredentialAttributes attributes={attributes} />
        </YStack>
        <DualResponseButtons onAccept={onAccept} onDecline={onDecline} isLoading={isAccepting} />
      </YStack>
    </ScrollView>
  )
}
