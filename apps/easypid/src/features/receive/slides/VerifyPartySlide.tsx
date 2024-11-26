import type { DisplayImage } from '@package/agent'

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
} from '@package/ui'
import { useRouter } from 'expo-router'
import { DualResponseButtons, useHaptics, useWizard } from 'packages/app/src'
import { formatRelativeDate } from 'packages/utils/src'
import { useState } from 'react'

interface VerifyPartySlideProps {
  type: 'offer' | 'request'
  host?: string
  name?: string
  entityId: string
  logo?: DisplayImage
  backgroundColor?: string
  lastInteractionDate?: string
  onContinue?: () => Promise<void>
  verifiedEntityIds?: Record<string, boolean>
}

export const VerifyPartySlide = ({
  type,
  entityId,
  name,
  logo,
  backgroundColor,
  lastInteractionDate,
  onContinue,
  verifiedEntityIds,
}: VerifyPartySlideProps) => {
  const router = useRouter()
  const { onNext, onCancel } = useWizard()
  const { withHaptics } = useHaptics()
  const [isLoading, setIsLoading] = useState(false)

  const trustedEntityIds = Object.entries(verifiedEntityIds ?? {})
    .filter(([_, isVerified]) => isVerified)
    .map(([entityId]) => entityId)

  const handleContinue = async () => {
    setIsLoading(true)
    if (onContinue) {
      await onContinue()
    }
    onNext()
    setIsLoading(false)
  }

  const onPressVerifiedIssuer = withHaptics(() => {
    router.push(
      `/issuer?name=${name}&logo=${logo?.url}&entityId=${entityId}&trustedEntityIds=${trustedEntityIds?.join(',') ?? ''}`
    )
  })

  const onPressInteraction = withHaptics(() => {
    router.push(`/activity?entityId=${entityId}`)
  })

  return (
    <YStack fg={1} jc="space-between">
      <ScrollView contentContainerStyle={{ gap: '$6' }}>
        <YStack gap="$4">
          <XStack ai="center" pt="$4" jc="center">
            <Circle size={88} bw="$0.5" borderColor="$grey-100" bg={backgroundColor ?? '$white'}>
              {logo?.url ? (
                <Image circle src={logo.url} alt={logo.altText} width="100%" height="100%" resizeMode="contain" />
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
          {trustedEntityIds && trustedEntityIds.length > 0 ? (
            <InfoButton
              variant="unknown"
              title="Verified organisation"
              description={`Approved by ${trustedEntityIds?.length} organisations`}
              onPress={onPressVerifiedIssuer}
            />
          ) : (
            <InfoButton
              variant="unknown"
              title="Unverified organization"
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
