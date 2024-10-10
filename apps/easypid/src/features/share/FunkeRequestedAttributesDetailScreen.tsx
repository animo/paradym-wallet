import { Heading, Image, MiniCard, Paragraph, ScrollView, Spacer, Stack, YStack, useToastController } from '@package/ui'
import React, { useState } from 'react'
import { useRouter } from 'solito/router'

import { CredentialAttributes, TextBackButton } from '@package/app/src/components'
import { useHasInternetConnection, useScrollViewPosition } from '@package/app/src/hooks'

import { usePidCredential } from '@easypid/hooks'
import { useCredentialsForDisplay } from 'packages/agent/src'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface FunkeRequestedAttributesDetailScreenProps {
  id: string
  disclosedPayload: Record<string, unknown>
  disclosedAttributeLength: number
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
  const [scrollViewHeight, setScrollViewHeight] = useState(0)

  const { credential: pidCredential } = usePidCredential()
  const credential = credentials.find((cred) => cred.id.includes(id))
  const activeCredential = pidCredential?.id.includes(id) ? pidCredential : credential

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
    <YStack bg="$background" height="100%" pb={bottom}>
      <Spacer size="$13" />
      <YStack borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'} />
      <YStack
        fg={1}
        onLayout={(e) => {
          if (scrollViewHeight === 0) {
            setScrollViewHeight(e.nativeEvent.layout.height)
          }
        }}
      >
        <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle} height={scrollViewHeight}>
          <YStack g="xl" pad="lg" py="$4">
            <MiniCard
              backgroundImage={activeCredential?.display.backgroundImage?.url}
              backgroundColor={activeCredential?.display.backgroundColor ?? '$grey-900'}
              hasInternet={hasInternet}
            />
            <Stack g="md">
              <Heading variant="h1">
                {disclosedAttributeLength} attribute{disclosedAttributeLength > 1 ? 's' : ''} from{' '}
                {activeCredential?.display.name}
              </Heading>
              {activeCredential?.display.issuer && (
                <Paragraph color="$grey-700">Issued by {activeCredential?.display.issuer.name}</Paragraph>
              )}
              <CredentialAttributes subject={disclosedPayload} headerTitle="Attributes" headerStyle="small" />
            </Stack>
          </YStack>
        </ScrollView>
      </YStack>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </YStack>
  )
}
