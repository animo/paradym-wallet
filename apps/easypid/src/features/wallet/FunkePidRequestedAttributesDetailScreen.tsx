import { Button, Heading, HeroIcons, IdCard, Paragraph, ScrollView, Spacer, Stack, YStack } from '@package/ui'
import React, { useMemo } from 'react'
import { useRouter } from 'solito/router'

import { CredentialAttributes } from '@package/app/src/components'
import { useScrollViewPosition } from '@package/app/src/hooks'

import germanIssuerImage from '../../../assets/german-issuer-image.png'
import { usePidCredential } from '../../hooks'

interface FunkePidRequestedAttributesDetailScreenProps {
  requestedAttributes: string[]
}

export function FunkePidRequestedAttributesDetailScreen({
  requestedAttributes,
}: FunkePidRequestedAttributesDetailScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const router = useRouter()

  const { isLoading, credential } = usePidCredential()
  if (isLoading) {
    return null
  }

  const filteredAttributes = useMemo(() => {
    return requestedAttributes.reduce(
      (requestedAttributeValues, attributeKey) => ({
        ...requestedAttributeValues,
        [attributeKey]: credential.attributes[attributeKey],
      }),
      {}
    )
  }, [requestedAttributes, credential.attributes])

  console.log(requestedAttributes)
  return (
    <YStack bg="$background" height="100%">
      <Spacer size="$13" />
      <YStack borderWidth={isScrolledByOffset ? 0.5 : 0} borderColor="$grey-300" />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack g="xl" pad="lg" py="$4">
          <IdCard issuerImage={germanIssuerImage} small />
          <Stack g="md">
            <Heading variant="title">{requestedAttributes.length} attributes from Personalausweis</Heading>
            <Paragraph>Issued by {credential.display.issuer.name}</Paragraph>
            <CredentialAttributes subject={filteredAttributes} headerTitle="Attributes" />
            <Button.Text onPress={() => router.back()} icon={<HeroIcons.ArrowLeft size={20} />}>
              Back
            </Button.Text>
          </Stack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
