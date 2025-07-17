import {
  FloatingSheet,
  Heading,
  LucideIcons,
  Paragraph,
  ScrollView,
  Spacer,
  Stack,
  YStack,
  useToastController,
} from '@package/ui'
import type { CredentialForDisplayId } from '@paradym/wallet-sdk/src/display/credential'
import { useAgent } from '@paradym/wallet-sdk/src/providers/AgentProvider'
import { deleteCredential } from '@paradym/wallet-sdk/src/storage/credentials'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useNavigation } from 'expo-router'
import { useCredentialById } from 'packages/sdk/src/hooks/useCredentialById'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CredentialAttributes, DualResponseButtons } from '../../components'
import { CredentialCard } from '../../components'
import { useScrollViewPosition } from '../../hooks'

export function CredentialDetailScreen() {
  const navigation = useNavigation()
  const params = useLocalSearchParams<{ id: CredentialForDisplayId }>()
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
        // FIXME: should remove pressable and pass it to Stack once
        // the following issue is resolved:
        // https://github.com/react-navigation/react-navigation/issues/12667
        <Pressable onPress={() => setIsSheetOpen(true)}>
          <Stack px="$4" py="$2" mr="$-4">
            <LucideIcons.Trash2 color={isSheetOpen ? '$danger-600' : '$danger-500'} />
          </Stack>
        </Pressable>
      ),
    })
  }, [navigation, isSheetOpen])

  // Go back home if no id is provided
  if (!params.id) {
    router.back()
    return null
  }

  const { credential } = useCredentialById(params.id)
  if (!credential) return null
  const { attributes, display } = credential

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
            <CredentialAttributes attributes={attributes} />
          </YStack>
        </YStack>
      </ScrollView>
      <FloatingSheet isOpen={isSheetOpen} setIsOpen={setIsSheetOpen}>
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
      </FloatingSheet>
    </YStack>
  )
}
