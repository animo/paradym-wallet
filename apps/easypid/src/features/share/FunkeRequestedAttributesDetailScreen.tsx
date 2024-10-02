import { Heading, Image, Paragraph, ScrollView, Spacer, Stack, YStack, useToastController } from '@package/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import { CredentialAttributes, TextBackButton } from '@package/app/src/components'
import { useHasInternetConnection, useScrollViewPosition } from '@package/app/src/hooks'

import { usePidCredential } from '@easypid/hooks'
import { useCredentialsForDisplay } from 'packages/agent/src'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface FunkeRequestedAttributesDetailScreenProps {
  id: string
  disclosedPayload: Record<string, unknown>
  disclosedAttributeLength: string
}

export function FunkeRequestedAttributesDetailScreen({
  id,
  disclosedPayload,
  disclosedAttributeLength,
}: FunkeRequestedAttributesDetailScreenProps) {
  const hasInternet = useHasInternetConnection()
  const toast = useToastController()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const { isLoading, credentials } = useCredentialsForDisplay()
  const router = useRouter()
  const { credential: pidCredential } = usePidCredential()
  const credential = credentials.find((credential) => credential.id.includes(id))

  const isPidCredential = pidCredential?.id.includes(id)

  const name = isPidCredential ? pidCredential?.display.name : credential?.display.name
  const issuer = isPidCredential ? pidCredential?.display.issuer.name : credential?.display.issuer.name
  const backgroundColor = isPidCredential ? pidCredential?.display.backgroundColor : credential?.display.backgroundColor
  const backgroundImage = isPidCredential ? pidCredential?.display.backgroundImage : credential?.display.backgroundImage

  if (isLoading) {
    return null
  }

  if (!credential) {
    toast.show('Error getting credential details', {
      message: 'Credential not found',
      customData: {
        preset: 'danger',
      },
    })
    router.back()
    return null
  }

  return (
    <YStack bg="$background" height="100%">
      <Spacer size="$13" />
      <YStack borderWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'} />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack g="xl" pad="lg" py="$4" marginBottom={bottom}>
          <Stack p="$2" h="$8" w="$12" br="$4" overflow="hidden" pos="relative" bg={backgroundColor ?? '$grey-900'}>
            {hasInternet && (
              <Stack pos="absolute" top={0} left={0} right={0} bottom={0}>
                <Image
                  src={backgroundImage?.url ?? ''}
                  alt={backgroundImage?.altText ?? ''}
                  resizeMode="cover"
                  height="100%"
                  width="100%"
                />
              </Stack>
            )}
          </Stack>
          <Stack g="md">
            <Heading variant="h1">
              {disclosedAttributeLength} attributes from {name}
            </Heading>
            {credential.display && <Paragraph color="$grey-700">Issued by {issuer}</Paragraph>}
            <CredentialAttributes subject={disclosedPayload} headerTitle="Attributes" headerStyle="small" />
            <TextBackButton />
          </Stack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
