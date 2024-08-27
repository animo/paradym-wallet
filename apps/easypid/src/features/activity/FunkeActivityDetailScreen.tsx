import { FlexPage, Heading, ScrollView, Stack, YStack } from '@package/ui'
import React from 'react'
import { createParam } from 'solito'

import { CredentialAttributes, TextBackButton, activityTitleMap } from '@package/app'
import { useScrollViewPosition } from '@package/app/src/hooks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'
import { useActivities } from './activityRecord'

const { useParams } = createParam<{ id: string }>()

// When it's a credential, it should render a credential detail screen.
// As we only have the PID credential this is currently not needed to implement.
// So the activity detail screen is always a 'shared data' screen.

export function FunkeActivityDetailScreen() {
  const { params } = useParams()
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()

  const { activities } = useActivities()
  const activity = activities.find((activity) => activity.id === params.id)

  if (!activity) {
    router.back()
    return
  }

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <FlexPage gap="$0" safeArea="t" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="title" fontWeight="$bold">
            {activityTitleMap[activity.type]}
          </Heading>
        </YStack>
      </YStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ minHeight: '90%' }}
      >
        <YStack g="xl" fg={1} px="$4" pb="$4" jc="space-between" marginBottom={bottom}>
          <CredentialAttributes
            // @TimoGlastra add attributes here
            subject={{
              Address: {},
              'Age over': { '21': true },
              'Credential Information': {
                credentialType: 'urn:eu.europa.ec.eudi:pid:1',
                expiresAt: '9/9/2024, 17:18:27',
                issuedAt: '26/8/2024, 17:18:27',
                issuer: 'https://demo.pid-issuer.bundesdruckerei.de/c',
                issuing_authority: 'DE',
                issuing_country: 'DE',
              },
              'Family name': 'MUSTERMANN',
              'Given name': 'ERIKA',
              'Place of birth': {},
            }}
            headerTitle="Attributes"
            headerStyle="small"
          />
          <TextBackButton />
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
