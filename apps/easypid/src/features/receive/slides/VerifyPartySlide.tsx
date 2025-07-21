import { Trans, useLingui } from '@lingui/react/macro'
import type { DisplayImage, TrustMechanism, TrustedEntity } from '@package/agent'
import { DualResponseButtons, useHaptics, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
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
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useActivities } from '../../activity/activityRecord'

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
  const { t } = useLingui()

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
                {name ? (
                  <Trans id="verifyPartySlide.offerCardSubtitle">${name} wants to offer you a card.</Trans>
                ) : (
                  <Trans id="verifyPartySlide.offerCardSubtitleUnknownOrganization">
                    An unknown organization wants to offer you a card.
                  </Trans>
                )}
              </Paragraph>
            ) : type === 'signing' ? (
              <Paragraph center px="$4">
                {name ? (
                  <Trans id="verifyPartySlide.signingSubtitle">
                    {name} wants to interact to create a digital signature for a document.
                  </Trans>
                ) : (
                  <Trans id="verifyPartySlide.signingSubtitleUnknownOrganization">
                    An unknown organization wants to interact to create a digital signature for a document.
                  </Trans>
                )}
              </Paragraph>
            ) : type === 'request' ? (
              <Paragraph center px="$4">
                {name ? (
                  <Trans id="verifyPartySlide.requestSubtitle">{name} wants to request information from you.</Trans>
                ) : (
                  <Trans id="verifyPartySlide.requestSubtitleUnknownOrganization">
                    An unknown organization wants to request information from you.
                  </Trans>
                )}
              </Paragraph>
            ) : type === 'connect' ? (
              <Paragraph center px="$4">
                {name ? (
                  <Trans id="verifyPartySlide.connectSubtitle">{name} wants to connect with you.</Trans>
                ) : (
                  <Trans id="verifyPartySlide.connectSubtitleUnknownOrganization">
                    An unknown organization wants to connect with you.
                  </Trans>
                )}
              </Paragraph>
            ) : null}
          </Stack>
        </YStack>

        <YStack gap="$4">
          {trustedEntitiesWithoutSelf && (trustedEntitiesWithoutSelf.length > 0 || entityIsTrustAnchor) ? (
            <InfoButton
              variant={entityIsTrustAnchor ? 'positive' : 'info'}
              title={t({
                id: 'verifyPartySlide.recognizedOrganizationTitle',
                message: 'Recognized organization',
              })}
              description={
                trustedEntitiesWithoutSelf.length > 1
                  ? t({
                      id: 'verifyPartySlide.approvedByMultipleOrganizations',
                      message: `Approved by ${trustedEntitiesWithoutSelf.length} organizations`,
                    })
                  : trustedEntitiesWithoutSelf.length === 1
                    ? t({
                        id: 'verifyPartySlide.approvedByOneOrganization',
                        message: 'Approved by one organization',
                      })
                    : undefined
              }
              onPress={onPressVerifiedIssuer}
            />
          ) : (
            <InfoButton
              variant="warning"
              title={t({
                id: 'verifyPartySlide.unknownOrganizationTitle',
                message: 'Unknown organization',
              })}
              description={t({
                id: 'verifyPartySlide.unknownOrganizationDescription',
                message: 'Organization is not verified',
              })}
              onPress={onPressVerifiedIssuer}
            />
          )}
          {isDemoTrustedEntity && (
            <InfoButton
              variant="warning"
              title={t({
                id: 'verifyPartySlide.demoTrustedEntityTitle',
                message: 'Demo organization',
              })}
              description={t({
                id: 'verifyPartySlide.demoTrustedEntityDescription',
                message: 'Do not share real data',
              })}
            />
          )}
          <InfoButton
            variant={lastInteractionDate ? 'interaction-success' : 'interaction-new'}
            title={
              lastInteractionDate
                ? t({ id: 'verifyPartySlide.hasPreviousInteractionsTitle', message: 'Previous interactions' })
                : t({ id: 'verifyPartySlide.hasNoPreviousInteractionsTitle', message: 'First time interaction' })
            }
            description={
              lastInteractionDate
                ? t({
                    id: 'verifyPartySlide.hasPreviousInteractionsDescription',
                    message: `Last interaction: ${formatRelativeDate(new Date(lastInteractionDate))}`,
                  })
                : t({
                    id: 'verifyPartySlide.hasNoPreviousInteractionsDescription',
                    message: 'No previous interactions found',
                  })
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
          acceptText={t(commonMessages.confirmContinue)}
          declineText={t(commonMessages.stop)}
          isLoading={isLoading}
        />
      </Stack>
    </YStack>
  )
}
