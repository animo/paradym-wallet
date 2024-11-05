import type { CredentialForDisplayId } from '@package/agent'

import { deleteCredential, useAgent, useCredentialForDisplayById } from '@package/agent'
import {
  Heading,
  LucideIcons,
  Paragraph,
  ScrollView,
  Sheet,
  Spacer,
  Stack,
  YStack,
  useToastController,
} from '@package/ui'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { createParam } from 'solito'

import { useNavigation } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CredentialAttributes, DualResponseButtons } from '../../components'
import { CredentialCard } from '../../components'
import { useScrollViewPosition } from '../../hooks'

const { useParams } = createParam<{ id: CredentialForDisplayId }>()

export function CredentialDetailScreen() {
  const navigation = useNavigation()
  const { params } = useParams()
  const router = useRouter()
  const toast = useToastController()
  const { bottom } = useSafeAreaInsets()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  const [isLoading, setIsLoading] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const { agent } = useAgent()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Stack px="$4" py="$2" onPress={() => setIsSheetOpen(true)} mr="$-4">
          <LucideIcons.Trash2 color={isSheetOpen ? '$danger-600' : '$danger-500'} />
        </Stack>
      ),
    })
  }, [navigation, isSheetOpen])

  // Go back home if no id is provided
  if (!params.id) {
    router.back()
    return null
  }

  const credentialForDisplay = useCredentialForDisplayById(params.id)
  if (!credentialForDisplay) return null

  const { attributes, display } = credentialForDisplay

  const onDeleteCredential = async () => {
    setIsLoading(true)

    try {
      await deleteCredential(agent, params.id)
      toast.show('Credential deleted', { type: 'success' })
      router.back()
    } catch (error) {
      toast.show('Error deleting credential', { type: 'error' })
      console.error(error)
    }

    setIsLoading(false)
  }

  return (
    <YStack bg="$background" height="100%">
      <Spacer size="$13" />
      <YStack borderWidth={isScrolledByOffset ? 0.5 : 0} borderColor="$grey-300" />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack g="3xl" jc="space-between" pad="lg" py="$4" pb="$12">
          <YStack g="xl">
            <CredentialCard
              issuerImage={display.issuer.logo}
              backgroundImage={display.backgroundImage}
              textColor={display.textColor}
              name={display.name}
              issuerName={display.issuer.name}
              subtitle={display.description}
              bgColor={display.backgroundColor}
            />
            <CredentialAttributes subject={attributes} />
          </YStack>
        </YStack>
      </ScrollView>
      <Sheet isOpen={isSheetOpen} setIsOpen={setIsSheetOpen}>
        <Stack p="$4" gap="$6" pb={bottom}>
          <Stack gap="$3">
            <Heading variant="h2">Delete '{display.name}'?</Heading>
            <Paragraph secondary>This will make the credential unusable and delete it from your wallet.</Paragraph>
          </Stack>
          <DualResponseButtons
            isLoading={isLoading}
            variant="confirmation"
            acceptText="Delete credential"
            declineText="Cancel"
            onAccept={onDeleteCredential}
            onDecline={() => setIsSheetOpen(false)}
          />
        </Stack>
      </Sheet>
    </YStack>
  )
}
