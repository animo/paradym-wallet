import { Button, Heading, HeroIcons, IdCard, Paragraph, ScrollView, Spacer, Stack, YStack } from '@package/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import { CredentialAttributes } from '@package/app/src/components'
import { useScrollViewPosition } from '@package/app/src/hooks'

import germanIssuerImage from '../../../assets/german-issuer-image.png'
import { usePidCredential } from '../../hooks'

interface FunkePidRequestedAttributesDetailScreenProps {
  disclosedPayload: Record<string, unknown>
  disclosedAttributeLength: string
}

export function FunkePidRequestedAttributesDetailScreen({
  disclosedPayload,
  disclosedAttributeLength,
}: FunkePidRequestedAttributesDetailScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const router = useRouter()

  const { isLoading, credential } = usePidCredential()
  if (isLoading) {
    return null
  }

  return (
    <YStack bg="$background" height="100%">
      <Spacer size="$13" />
      <YStack borderWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'} />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack g="xl" pad="lg" py="$4">
          <IdCard issuerImage={germanIssuerImage} small />
          <Stack g="md">
            <Heading variant="title">{disclosedAttributeLength} attributes from Personalausweis</Heading>
            {credential.display && <Paragraph>Issued by {credential.display.issuer.name}</Paragraph>}
            <CredentialAttributes subject={disclosedPayload} headerTitle="Attributes" />
            <Button.Text onPress={() => router.back()} icon={<HeroIcons.ArrowLeft size={20} />}>
              Back
            </Button.Text>
          </Stack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
