import type { DisplayImage, TrustedEntity } from '@package/agent'

import { DualResponseButtons, useHaptics, useWizard } from '@package/app'
import {
  Circle,
  Heading,
  HeroIcons,
  Image,
  InfoButton,
  Paragraph,
  ScrollView,
  Stack,
  XStack,
  YStack,
  useMedia,
} from '@package/ui'
import { useRouter } from 'expo-router'
import { formatRelativeDate } from 'packages/utils/src'
import { useState } from 'react'

interface VerifyPartySlideProps {
  type: 'offer' | 'request' | 'signing'
  host?: string
  name?: string
  entityId: string
  logo?: DisplayImage
  backgroundColor?: string
  lastInteractionDate?: string
  onContinue?: () => Promise<void>
  trustedEntities?: Array<TrustedEntity>
}

export const VerifyPartySlide = ({
  type,
  entityId,
  name,
  logo,
  backgroundColor,
  lastInteractionDate,
  onContinue,
  trustedEntities,
}: VerifyPartySlideProps) => {
  const router = useRouter()
  const media = useMedia()
  const { onNext, onCancel } = useWizard()
  const { withHaptics } = useHaptics()
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    setIsLoading(true)
    if (onContinue) {
      await onContinue()
    }
    onNext()
    setIsLoading(false)
  }

  const entityIsTrustAnchor = trustedEntities?.some((entity) => entity.entity_id === entityId)

  const trustedEntitiesWithoutSelf = trustedEntities?.filter((entity) => entity.entity_id !== entityId)

  const onPressVerifiedIssuer = withHaptics(() => {
    router.push(
      `/federation?name=${encodeURIComponent(name ?? '')}&logo=${encodeURIComponent(logo?.url ?? '')}&entityId=${encodeURIComponent(entityId)}&trustedEntities=${encodeURIComponent(JSON.stringify(trustedEntitiesWithoutSelf ?? []))}`
    )
  })

  const onPressInteraction = withHaptics(() => {
    router.push(`/activity?entityId=${entityId}`)
  })

  return (
    <YStack fg={1} jc="space-between">
      <ScrollView contentContainerStyle={{ gap: media.short ? '$4' : '$6' }}>
        <YStack gap="$4">
          <XStack ai="center" pt="$4" jc="center">
            <Circle size={88} bw="$0.5" borderColor="$grey-100" bg={backgroundColor ?? '$white'}>
              {logo?.url ? (
                <Image circle src={logo.url} alt={logo.altText} width="100%" height="100%" contentFit="contain" />
              ) : (
                <HeroIcons.BuildingOffice color="$grey-800" size={36} />
              )}
            </Circle>
          </XStack>
          <Stack gap="$2">
            <Heading variant="h2" numberOfLines={2} center fontSize={24}>
              {name ? `Interact with ${name}?` : 'Organization not verified'}
            </Heading>
            {type === 'offer' ? (
              <Paragraph center px="$4">
                {name ? `${name} wants to offer you a card.` : 'An unknown organization wants to offer you a card.'}
              </Paragraph>
            ) : type === 'signing' ? (
              <Paragraph center px="$4">
                {name
                  ? `${name} wants interact to create a digital signature for a document.`
                  : 'An unknown organization wants to interact to create a digital signature for a document.'}
              </Paragraph>
            ) : (
              <Paragraph center px="$4">
                {name
                  ? `${name} wants to request information from you.`
                  : 'An unknown organization wants to request information from you.'}
              </Paragraph>
            )}
          </Stack>
        </YStack>

        <YStack gap="$4">
          {trustedEntitiesWithoutSelf && (trustedEntitiesWithoutSelf.length > 0 || entityIsTrustAnchor) ? (
            <InfoButton
              variant={entityIsTrustAnchor ? 'positive' : 'info'}
              title="Recognized organisation"
              description={
                trustedEntitiesWithoutSelf.length > 0
                  ? `Approved by ${trustedEntitiesWithoutSelf.length} organisation${
                      trustedEntitiesWithoutSelf.length === 1 ? '' : 's'
                    }`
                  : undefined
              }
              onPress={onPressVerifiedIssuer}
            />
          ) : (
            <InfoButton
              variant="warning"
              title="Unrecognized organisation"
              description="No trust approvals found"
              onPress={onPressVerifiedIssuer}
            />
          )}
          <InfoButton
            variant={lastInteractionDate ? 'interaction-success' : 'interaction-new'}
            title={lastInteractionDate ? 'Previous interactions' : 'First time interaction'}
            description={
              lastInteractionDate
                ? `Last interaction: ${formatRelativeDate(new Date(lastInteractionDate))}`
                : 'No previous interactions found'
            }
            onPress={lastInteractionDate ? onPressInteraction : undefined}
          />
        </YStack>
      </ScrollView>
      <Stack btw={1} borderColor="$grey-100" p="$4" mx="$-4">
        <DualResponseButtons
          align="horizontal"
          onAccept={handleContinue}
          onDecline={() => onCancel()}
          acceptText="Yes, continue"
          declineText="Stop"
          isLoading={isLoading}
        />
      </Stack>
    </YStack>
  )
}
