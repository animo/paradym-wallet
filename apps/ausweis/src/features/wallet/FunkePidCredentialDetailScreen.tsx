import { Button, Heading, HeroIcons, IdCard, ScrollView, Spacer, Stack, YStack } from '@package/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import { CredentialAttributes } from '@package/app/src/components'
import { useScrollViewPosition } from '@package/app/src/hooks'

import germanIssuerImage from '../../../assets/german-issuer-image.png'
import { usePidCredential } from '../../hooks'

export function FunkePidCredentialDetailScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const router = useRouter()

  const { isLoading, credential } = usePidCredential()
  if (isLoading) {
    return null
  }

  return (
    <YStack bg="$background" height="100%">
      <Spacer size="$13" />
      <YStack borderWidth={isScrolledByOffset ? 0.5 : 0} borderColor="$grey-300" />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack g="xl" pad="lg" py="$4">
          <IdCard issuerImage={germanIssuerImage} />
          <Stack g="md">
            <Heading variant="title">Personalausweis</Heading>
            <CredentialAttributes subject={credential.attributes} headerTitle="Attributes" />
            <Button.Text onPress={() => router.back()} icon={<HeroIcons.ArrowLeft size={20} />}>
              Back
            </Button.Text>
          </Stack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
