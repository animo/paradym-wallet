import type { CredentialForDisplayId } from '@internal/agent'

import { useCredentialForDisplayById } from '@internal/agent'
import { ScrollView, YStack, Spacer, Trash2 } from '@internal/ui'
import { useNavigation } from 'expo-router'
import React, { useEffect } from 'react'
import { Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import CredentialAttributes from 'app/components/CredentialAttributes'
import CredentialCard from 'app/components/CredentialCard'
import NavHeader from 'app/components/NavHeader'
import useScrollViewPosition from 'app/hooks/useScrollViewPosition'

const { useParams } = createParam<{ id: CredentialForDisplayId }>()

export function CredentialDetailScreen() {
  const { top } = useSafeAreaInsets()
  const { params } = useParams()
  const router = useRouter()
  const navigation = useNavigation()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <NavHeader>
          <Trash2 color="$danger-500" />
        </NavHeader>
      ),
    })
  }, [navigation])

  // Go back home if no id is provided
  if (!params.id) {
    router.back()
    return null
  }

  const credentialForDisplay = useCredentialForDisplayById(params.id)
  if (!credentialForDisplay) return null

  const { attributes, display } = credentialForDisplay

  const onDeleteCredential = () => {
    Alert.prompt('Are you sure?')
  }

  return (
    <YStack bg="$grey-200" height="100%" top={top}>
      <Spacer size="$4" />
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
    </YStack>
  )
}
