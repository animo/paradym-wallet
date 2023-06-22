import { getCredentialForDisplay, useW3cCredentialRecordById } from '@internal/agent'
import { ScrollView, YStack, Spacer } from '@internal/ui'
import React from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import CredentialAttributes from 'app/components/CredentialAttributes'
import CredentialCard from 'app/components/CredentialCard'
import useScrollViewPosition from 'app/hooks/useScrollViewPosition'

const { useParam } = createParam<{ id: string }>()

export function CredentialDetailScreen() {
  const [id] = useParam('id')
  const router = useRouter()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  // Go back home if no id is provided
  if (!id) {
    router.back()
    return null
  }

  const record = useW3cCredentialRecordById(id)
  if (!record) return null

  const { credential, display } = getCredentialForDisplay(record)

  return (
    <YStack bg="$grey-200">
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
            <CredentialAttributes
              subject={
                // FIXME: support credential with multiple subjects
                Array.isArray(credential.credentialSubject)
                  ? credential.credentialSubject[0] ?? {}
                  : credential.credentialSubject
              }
            />
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
