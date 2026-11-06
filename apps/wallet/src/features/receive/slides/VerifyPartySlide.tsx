import { Trans, useLingui } from '@lingui/react/macro'
import { ConfirmationSheet, DualResponseButtons, SlidePane, useHaptics, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import {
  Circle,
  Heading,
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
import type { DisplayImage, TrustedEntity } from '@paradym/wallet-sdk'
import { useActivities } from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'

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
  /** Whether the request asks for more than the organization registered to ask for */
  isOverAsking?: boolean
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
  isOverAsking,
}: VerifyPartySlideProps) => {
  const router = useRouter()
  const media = useMedia()
  const { onNext, onCancel, isCombined, setCombinedContinue, setCombinedConfirm, ownsWideLayout } = useWizard()
  const { withHaptics } = useHaptics()
  const [isLoading, setIsLoading] = useState(false)
  const { activities } = useActivities({ filters: { entityId }, limit: 1 })
  const lastInteractionDate = activities[0]?.date
  const { t } = useLingui()
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isOverAskingConfirmationOpen, setIsOverAskingConfirmationOpen] = useState(false)
  const resolveOverAskingConfirmation = useRef<(confirmed: boolean) => void>(undefined)
  const isOverAskingConfirmed = useRef(false)

  const entityIsTrustAnchor = trustedEntities?.some((entity) => entity.entityId === entityId)
  const isDemoTrustedEntity = trustedEntities?.some((entity) => entity.demo) ?? false
  const trustedEntitiesWithoutSelf = trustedEntities?.filter((entity) => entity.entityId !== entityId)

  // With the country of its trusted list, as several countries can list the same kind of organization
  const approvedBy = trustedEntitiesWithoutSelf?.[0]
  const territoryMessage = approvedBy?.territory
    ? commonMessages.trustedListTerritories[approvedBy.territory]
    : undefined
  const approvedByTerritory = territoryMessage ? t(territoryMessage) : approvedBy?.territory

  // Next to the next step in a wide window, that step's buttons continue this one
  useEffect(() => {
    setCombinedContinue?.(onContinue)
    return () => setCombinedContinue?.(undefined)
  }, [setCombinedContinue, onContinue])

  // Over-asking is confirmed a second time, once, before continuing from this step or the step next to it
  const confirmOverAsking = useCallback(() => {
    if (isOverAskingConfirmed.current) return Promise.resolve(true)
    return new Promise<boolean>((resolve) => {
      resolveOverAskingConfirmation.current = resolve
      setIsOverAskingConfirmationOpen(true)
    })
  }, [])

  const closeOverAskingConfirmation = (confirmed: boolean) => {
    isOverAskingConfirmed.current = confirmed
    setIsOverAskingConfirmationOpen(false)
    resolveOverAskingConfirmation.current?.(confirmed)
    resolveOverAskingConfirmation.current = undefined
  }

  useEffect(() => {
    setCombinedConfirm?.(isOverAsking ? confirmOverAsking : undefined)
    return () => setCombinedConfirm?.(undefined)
  }, [setCombinedConfirm, isOverAsking, confirmOverAsking])

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

  const onPressInteraction = withHaptics(() => {
    router.push(`/activity?entityId=${entityId}`)
  })

  const header = (
    <YStack gap="5" pt="5">
      {logo?.url && (
        <XStack items="center" justify="center">
          <Circle size={88} borderWidth="1" borderColor="grey-100" bg={backgroundColor ?? 'white'}>
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
          </Circle>
        </XStack>
      )}
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
      {/* Only a recognized organization is checked for over-asking, so the warning takes its place */}
      {isOverAsking ? (
        <InfoButton
          variant="danger"
          title={t(commonMessages.overAsking)}
          description={
            name ? t(commonMessages.overAskingWarning(name)) : t(commonMessages.overAskingWarningUnknownOrganization)
          }
        />
      ) : trustedEntitiesWithoutSelf && (trustedEntitiesWithoutSelf.length > 0 || entityIsTrustAnchor) ? (
        <InfoButton
          variant="positive"
          title={t(commonMessages.recognizedOrganization)}
          description={
            approvedBy
              ? approvedByTerritory
                ? t(commonMessages.approvedByInTerritory(approvedBy.organizationName, approvedByTerritory))
                : t(commonMessages.approvedBy(approvedBy.organizationName))
              : undefined
          }
        />
      ) : (
        <InfoButton
          variant="warning"
          title={t(commonMessages.unknownOrganization)}
          description={t(commonMessages.organizationNotVerifiedDescription)}
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
        onAccept={async () => {
          if (isOverAsking && !(await confirmOverAsking())) return
          await handleContinue()
        }}
        onDecline={handleDecline}
        acceptText={t(commonMessages.confirmContinue)}
        declineText={t(commonMessages.stop)}
        isLoading={isLoading}
        variant={isOverAsking ? 'confirmation' : 'regular'}
      />
    </Stack>
  )

  const overAskingConfirmation = isOverAsking && (
    <ConfirmationSheet
      isOpen={isOverAskingConfirmationOpen}
      setIsOpen={(isOpen) => (isOpen ? setIsOverAskingConfirmationOpen(true) : closeOverAskingConfirmation(false))}
      title={t({
        id: 'verifyPartySlide.overAskingConfirmationTitle',
        message: 'Continue anyway?',
        comment:
          'Title of the sheet that asks to confirm continuing with a request that asks for more than the organization registered',
      })}
      description={
        // Next to the next step, confirming acts right away, so there is nothing left to review
        isCombined
          ? name
            ? t({
                id: 'verifyPartySlide.overAskingConfirmationDescriptionCombined',
                message: `${name} asks for more than it registered.`,
                comment:
                  'Shown in the sheet that asks to confirm a request that asks for more than the organization registered, next to the request itself, with the name of the organization',
              })
            : t({
                id: 'verifyPartySlide.overAskingConfirmationDescriptionCombinedUnknownOrganization',
                message: 'This organization asks for more than it registered.',
                comment:
                  'Shown in the sheet that asks to confirm a request that asks for more than the organization registered, next to the request itself, when the name of the organization is unknown',
              })
          : name
            ? t({
                id: 'verifyPartySlide.overAskingConfirmationDescription',
                message: `${name} asks for more than it registered. You can review the request before anything is shared.`,
                comment:
                  'Shown in the sheet that asks to confirm continuing with a request that asks for more than the organization registered, with the name of the organization',
              })
            : t({
                id: 'verifyPartySlide.overAskingConfirmationDescriptionUnknownOrganization',
                message:
                  'This organization asks for more than it registered. You can review the request before anything is shared.',
                comment:
                  'Shown in the sheet that asks to confirm continuing with a request that asks for more than the organization registered, when the name of the organization is unknown',
              })
      }
      confirmText={t(commonMessages.confirmContinue)}
      onConfirm={() => closeOverAskingConfirmation(true)}
    />
  )

  if (ownsWideLayout) {
    // Wide windows show who it is on the left, next to whether to trust them
    return (
      <>
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
        {overAskingConfirmation}
      </>
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
      {overAskingConfirmation}
    </YStack>
  )
}
