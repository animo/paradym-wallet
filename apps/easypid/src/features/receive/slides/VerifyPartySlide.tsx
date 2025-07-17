import type { TrustMechanism, TrustedEntity } from '@package/agent'
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
import { formatRelativeDate } from '@package/utils'
import type { DisplayImage } from '@paradym/wallet-sdk/src/display/credential'
import { useActivities } from '@paradym/wallet-sdk/src/hooks/useActivities'
import { useRouter } from 'expo-router'
import { useState } from 'react'

const NO_ENTITY_ID = 'NO_ENTITY_ID'

interface VerifyPartySlideProps {
  type: 'offer' | 'request' | 'signing' | 'connect'
  host?: string
  name?: string
  entityId?: string
  logo?: DisplayImage
  backgroundColor?: string
  onContinue?: () => Promise<void>
  onDecline?: () => void
  trustedEntities?: Array<TrustedEntity>
  trustMechanism?: TrustMechanism
}

export const VerifyPartySlide = ({
  type,
  entityId = NO_ENTITY_ID,
  name,
  logo,
  backgroundColor,
  onContinue,
  onDecline,
  trustedEntities,
  trustMechanism = 'x509',
}: VerifyPartySlideProps) => {
  const router = useRouter()
  const media = useMedia()
  const { onNext, onCancel } = useWizard()
  const { withHaptics } = useHaptics()
  const [isLoading, setIsLoading] = useState(false)
  const { activities } = useActivities({ filters: { entityId } })
  const lastInteractionDate = activities[0]?.date

  const entityIsTrustAnchor = trustedEntities?.some((entity) => entity.entityId === entityId)
  const isDemoTrustedEntity = trustedEntities?.some((entity) => entity.demo) ?? false
  const trustedEntitiesWithoutSelf = trustedEntities
    ?.filter((entity) => entity.entityId !== entityId)
    .map((entity) => ({ ...entity, demo: isDemoTrustedEntity ? true : entity.demo }))

  const handleContinue = async () => {
    setIsLoading(true)
    if (onContinue) {
      await onContinue()
    }
    onNext()
    setIsLoading(false)
  }

  const handleDecline = async () => {
    onDecline?.()
    onCancel()
  }

  const onPressVerifiedIssuer = withHaptics(() => {
    const searchParams = new URLSearchParams({
      trustedEntities: JSON.stringify(trustedEntitiesWithoutSelf ?? []),
      trustMechanism,
      isDemoTrustedEntity: `${isDemoTrustedEntity}`,
    })

    if (logo?.url) searchParams.set('logo', logo.url)
    if (name) searchParams.set('name', name)

    router.push(`trust?${searchParams}`)
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
                  ? `${name} wants to interact to create a digital signature for a document.`
                  : 'An unknown organization wants to interact to create a digital signature for a document.'}
              </Paragraph>
            ) : type === 'request' ? (
              <Paragraph center px="$4">
                {name
                  ? `${name} wants to request information from you.`
                  : 'An unknown organization wants to request information from you.'}
              </Paragraph>
            ) : type === 'connect' ? (
              <Paragraph center px="$4">
                {name ? `${name} wants to connect with you.` : 'An unknown organization wants to connect with you.'}
              </Paragraph>
            ) : null}
          </Stack>
        </YStack>

        <YStack gap="$4">
          {trustedEntitiesWithoutSelf && (trustedEntitiesWithoutSelf.length > 0 || entityIsTrustAnchor) ? (
            <InfoButton
              variant={entityIsTrustAnchor ? 'positive' : 'info'}
              title="Recognized organization"
              description={
                trustedEntitiesWithoutSelf.length > 0
                  ? `Approved by ${trustedEntitiesWithoutSelf.length} organization${
                      trustedEntitiesWithoutSelf.length === 1 ? '' : 's'
                    }`
                  : undefined
              }
              onPress={onPressVerifiedIssuer}
            />
          ) : (
            <InfoButton
              variant="warning"
              title="Unknown organization"
              description="Organization is not verified"
              onPress={onPressVerifiedIssuer}
            />
          )}
          {isDemoTrustedEntity && (
            <InfoButton variant="warning" title="Demo organization" description="Do not share real data" />
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
          onDecline={handleDecline}
          acceptText="Yes, continue"
          declineText="Stop"
          isLoading={isLoading}
        />
      </Stack>
    </YStack>
  )
}
