import { Trans, useLingui } from '@lingui/react/macro'
import { DualResponseButtons, SlidePane, useHaptics, useWizard } from '@package/app'
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
  TwoPane,
  useMedia,
  XStack,
  YStack,
} from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import type { DisplayImage, TrustedEntity, TrustMechanism } from '@paradym/wallet-sdk'
import { useActivities } from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'

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
  trustMechanism = 'none',
}: VerifyPartySlideProps) => {
  const router = useRouter()
  const media = useMedia()
  const { onNext, onCancel, isCombined, setCombinedContinue, ownsWideLayout } = useWizard()
  const { withHaptics } = useHaptics()
  const [isLoading, setIsLoading] = useState(false)
  const { activities } = useActivities({ filters: { entityId }, limit: 1 })
  const lastInteractionDate = activities[0]?.date
  const { t } = useLingui()
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const entityIsTrustAnchor = trustedEntities?.some((entity) => entity.entityId === entityId)
  const isDemoTrustedEntity = trustedEntities?.some((entity) => entity.demo) ?? false

  const trustedEntitiesWithoutSelf = trustedEntities
    ?.filter((entity) => entity.entityId !== entityId)
    .map((entity) => ({
      ...entity,
      demo: isDemoTrustedEntity ? true : entity.demo,
    }))

  // Next to the next step in a wide window, that step's buttons continue this one
  useEffect(() => {
    setCombinedContinue?.(onContinue)
    return () => setCombinedContinue?.(undefined)
  }, [setCombinedContinue, onContinue])

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

  const header = (
    <YStack gap="5">
      <XStack items="center" pt="5" justify="center">
        <Circle size={88} borderWidth="1" borderColor="grey-100" bg={backgroundColor ?? 'white'}>
          {logo?.url ? (
            <Image
              circle
              src={logo.url}
              alt={logo.altText}
              testID={isImageLoaded ? 'entity-image-loaded' : 'entity-image'}
              onLoad={() => setIsImageLoaded(true)}
              width="100%"
              height="100%"
              contentFit="contain"
            />
          ) : (
            <HeroIcons.BuildingOffice color="grey-800" size={36} />
          )}
        </Circle>
      </XStack>
      <Stack gap="2">
        <Heading heading="h2" numberOfLines={2} fontSize={24} lineHeight="5" center>
          {name ? t(commonMessages.doYouTrust(name)) : t(commonMessages.organizationNotVerifiedHeading)}
        </Heading>
        {type === 'offer' ? (
          <Paragraph center px="5">
            {name ? (
              <Trans id="verifyPartySlide.offerCardSubtitle">{name} wants to offer you a card.</Trans>
            ) : (
              <Trans id="verifyPartySlide.offerCardSubtitleUnknownOrganization">
                An unknown organization wants to offer you a card.
              </Trans>
            )}
          </Paragraph>
        ) : type === 'signing' ? (
          <Paragraph center px="5">
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
          <Paragraph center px="5">
            {name ? (
              <Trans id="verifyPartySlide.requestSubtitle">{name} wants to request information from you.</Trans>
            ) : (
              <Trans id="verifyPartySlide.requestSubtitleUnknownOrganization">
                An unknown organization wants to request information from you.
              </Trans>
            )}
          </Paragraph>
        ) : type === 'connect' ? (
          <Paragraph center px="5">
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
  )

  const trustDetails = (
    <YStack gap="5">
      {trustedEntitiesWithoutSelf && (trustedEntitiesWithoutSelf.length > 0 || entityIsTrustAnchor) ? (
        <InfoButton
          variant={entityIsTrustAnchor ? 'positive' : 'info'}
          title={t(commonMessages.recognizedOrganization)}
          description={
            trustedEntitiesWithoutSelf.length > 1
              ? t(commonMessages.approvedByOrganizations(trustedEntitiesWithoutSelf.length))
              : trustedEntitiesWithoutSelf.length === 1
                ? t(commonMessages.approvedByOneOrganization)
                : undefined
          }
          onPress={onPressVerifiedIssuer}
        />
      ) : (
        <InfoButton
          variant="warning"
          title={t(commonMessages.unknownOrganization)}
          description={t(commonMessages.organizationNotVerifiedDescription)}
          onPress={onPressVerifiedIssuer}
        />
      )}
      {isDemoTrustedEntity && (
        <InfoButton
          variant="warning"
          title={t(commonMessages.demoOrganization)}
          description={t(commonMessages.demoOrganizationWarning)}
        />
      )}
      <InfoButton
        variant={lastInteractionDate ? 'interaction-success' : 'interaction-new'}
        title={
          lastInteractionDate
            ? t({
                id: 'verifyPartySlide.hasPreviousInteractionsTitle',
                message: 'Previous interactions',
              })
            : t({
                id: 'verifyPartySlide.hasNoPreviousInteractionsTitle',
                message: 'First time interaction',
              })
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
  )

  const footer = (
    <Stack borderTopWidth={1} borderColor="grey-100" px="5" pt="3" mx="-5">
      <DualResponseButtons
        align="horizontal"
        onAccept={handleContinue}
        onDecline={handleDecline}
        acceptText={t(commonMessages.confirmContinue)}
        declineText={t(commonMessages.stop)}
        isLoading={isLoading}
      />
    </Stack>
  )

  if (ownsWideLayout) {
    // Wide windows show who it is on the left, next to whether to trust them
    return (
      <TwoPane
        start={<SlidePane>{header}</SlidePane>}
        end={
          <SlidePane>
            <YStack grow={1} justify="space-between" gap="5">
              {trustDetails}
              {footer}
            </YStack>
          </SlidePane>
        }
      />
    )
  }

  return (
    // Shrinks to the window's height, so the buttons stay at the bottom and the content above them scrolls
    <YStack flex={1} justify="space-between">
      <ScrollView contentContainerStyle={{ gap: media.short ? '5' : '8' }}>
        {header}
        {trustDetails}
      </ScrollView>
      {!isCombined && footer}
    </YStack>
  )
}
