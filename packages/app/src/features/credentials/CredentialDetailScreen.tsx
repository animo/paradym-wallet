import type { CredentialForDisplayId } from '@package/agent'

import { useCredentialForDisplayById } from '@package/agent'
import { ScrollView, Spacer, YStack } from '@package/ui'
import React from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import { CredentialAttributes } from '../../components'
import { CredentialCard } from '../../components'
import { useScrollViewPosition } from '../../hooks'

const { useParams } = createParam<{ id: CredentialForDisplayId }>()

export function CredentialDetailScreen() {
  const { params } = useParams()
  const router = useRouter()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  // Go back home if no id is provided
  if (!params.id) {
    router.back()
    return null
  }

  const credentialForDisplay = useCredentialForDisplayById(params.id)
  if (!credentialForDisplay) return null

  const { attributes, display } = credentialForDisplay

  return (
    <YStack bg="$grey-200" height="100%">
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
    </YStack>
  )
}
