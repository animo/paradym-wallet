import { Heading, IdCard, ScrollView, Spacer, Stack, YStack } from '@package/ui'
import React from 'react'

import { CredentialAttributes } from '@package/app/src/components'
import { useScrollViewPosition } from '@package/app/src/hooks'
import { TextBackButton } from 'packages/app'

import { useSafeAreaInsets } from 'react-native-safe-area-context'
import germanIssuerImage from '../../../assets/german-issuer-image.png'
import { usePidCredential } from '../../hooks'

export function FunkePidCredentialDetailScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { isLoading, credential } = usePidCredential()
  if (isLoading) {
    return null
  }

  return (
    <YStack bg="$background" height="100%">
      <Spacer size="$13" />
      <YStack borderWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'} />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack g="xl" p="$4" marginBottom={bottom}>
          <IdCard issuerImage={germanIssuerImage} small />
          <Stack g="md">
            <Heading variant="h1">Personalausweis</Heading>
            <CredentialAttributes
              subject={credential.attributesForDisplay ?? credential.attributes}
              headerTitle="Attributes"
              headerStyle="small"
            />
          </Stack>
          <TextBackButton />
        </YStack>
      </ScrollView>
    </YStack>
  )
}
