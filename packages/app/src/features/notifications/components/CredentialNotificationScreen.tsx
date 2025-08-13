import type { CredentialDisplay } from '@package/agent'

import { Trans } from '@lingui/react/macro'
import { Heading, ScrollView, YStack } from '@package/ui'
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
        minHeight: '100%',
      }}
      safeAreaBottom={bottom}
    >
      <YStack g="3xl" jc="space-between" height="100%" pad="lg" py="$6">
        <YStack g="2xl">
          <Heading variant="h2" fontWeight="$medium" ta="center" px="$4" letterSpacing={-0.5}>
            {display.issuer?.name ? (
              <Trans
                id="credentialNotification.receivedCredentialWithIssuerName"
                comment="Heading shown when user receives a credential, including issuer name"
              >
                You have received a credential from {display.issuer.name}
              </Trans>
            ) : (
              <Trans
                id="credentialNotification.receivedCredential"
                comment="Heading shown when user receives a credential when issuer name is not available"
              >
                You have received a credential
              </Trans>
            )}
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
