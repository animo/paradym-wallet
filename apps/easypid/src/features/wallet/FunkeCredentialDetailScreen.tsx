import { FlexPage, Heading, MiniCard, Paragraph, ScrollView, Stack, YStack, useToastController } from '@package/ui'
import React from 'react'

import { CredentialAttributes } from '@package/app/src/components'
import { useHasInternetConnection, useScrollViewPosition } from '@package/app/src/hooks'
import { TextBackButton } from 'packages/app'

import { useRouter } from 'expo-router'
import { useCredentialsForDisplay } from 'packages/agent/src'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createParam } from 'solito'
import { usePidCredential } from '../../hooks'

const { useParams } = createParam<{ id: string }>()

export function FunkeCredentialDetailScreen() {
  const toast = useToastController()
  const { params } = useParams()
  const router = useRouter()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()
  const hasInternet = useHasInternetConnection()

  const { credentials } = useCredentialsForDisplay()
  const { credential: pidCredential } = usePidCredential()
  const credential = credentials.find((cred) => cred.id.includes(params.id))
  const activeCredential = pidCredential?.id.includes(params.id) ? pidCredential : credential

  if (!activeCredential) {
    toast.show('Credential not found', {
      customData: {
        preset: 'danger',
      },
    })
    router.back()
    return
  }

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack
        w="100%"
        top={0}
        p="$4"
        borderBottomWidth="$0.5"
        borderColor={isScrolledByOffset ? '$grey-200' : '$background'}
      />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack gap="$4" p="$4" marginBottom={bottom}>
          <MiniCard
            backgroundImage={activeCredential.display.backgroundImage?.url}
            backgroundColor={activeCredential.display.backgroundColor ?? '$grey-900'}
            hasInternet={hasInternet}
          />
          <Stack gap="$2">
            <Heading variant="h1">{activeCredential.display.name}</Heading>
            {activeCredential.display.issuer && <Paragraph>Issued by {activeCredential.display.issuer.name}</Paragraph>}
          </Stack>
          <CredentialAttributes subject={activeCredential.attributes} disableHeader headerStyle="small" />
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
